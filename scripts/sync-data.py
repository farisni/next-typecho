#!/usr/bin/env python3
"""安全同步本地数据到生产服务器。

这个脚本会用 SQLite 的 VACUUM INTO 生成一致性数据库快照，避免直接复制
dev.db 时漏掉 WAL/SHM 内容导致生产库损坏。

示例：
    python3 scripts/sync-data.py
    python3 scripts/sync-data.py --skip-uploads
"""

from __future__ import annotations

import argparse
import os
import re
import shlex
import shutil
import sqlite3
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path


DEFAULT_HOST = "8.134.150.114"
DEFAULT_USER = "root"
DEFAULT_KEY = Path.home() / ".ssh" / "id_ed25519"
DEFAULT_REMOTE_ROOT = "/opt/next-typecho"
DEFAULT_DOMAIN = "www.farisni.com"
DEFAULT_LOCAL_DB = Path("data/dev.db")
REMOTE_DB = "/tmp/next-typecho-sync.db"
REMOTE_UPLOADS = "/tmp/next-typecho-sync-uploads.tgz"
SAFE_DOMAIN = re.compile(r"^[A-Za-z0-9.-]+$")


def run(command: list[str], *, input_text: str | None = None, cwd: Path | None = None) -> None:
    print("+", " ".join(shlex.quote(part) for part in command), flush=True)
    subprocess.run(command, input=input_text, cwd=cwd, text=True, check=True)


def ssh_base(host: str, user: str, key: Path) -> list[str]:
    return [
        "ssh", "-i", str(key), "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=20", "-o", "ConnectionAttempts=3",
        f"{user}@{host}",
    ]


def scp_base(key: Path) -> list[str]:
    return [
        "scp", "-i", str(key), "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=20", "-o", "ConnectionAttempts=3",
    ]


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def make_sqlite_snapshot(source: Path) -> Path:
    fd, snapshot_name = tempfile.mkstemp(prefix="next-typecho-sync-", suffix=".db")
    os.close(fd)
    snapshot = Path(snapshot_name)
    snapshot.unlink(missing_ok=True)

    with sqlite3.connect(source) as database:
        database.execute(f"VACUUM INTO {sql_quote(str(snapshot))}")

    with sqlite3.connect(snapshot) as database:
        result = database.execute("PRAGMA integrity_check").fetchone()
    if not result or result[0] != "ok":
        snapshot.unlink(missing_ok=True)
        raise SystemExit(f"本地数据库快照校验失败: {result[0] if result else 'unknown'}")
    return snapshot


def iter_upload_roots(project_dir: Path) -> list[Path]:
    return [
        project_dir / "public" / "uploads",
        Path.home() / "data" / "next-typecho" / "uploads",
    ]


def make_uploads_archive(project_dir: Path) -> Path | None:
    upload_files: dict[str, Path] = {}
    for root in iter_upload_roots(project_dir):
        if not root.is_dir():
            continue
        for item in root.iterdir():
            if item.is_file() and item.name != ".gitkeep" and not item.name.startswith("._"):
                upload_files[item.name] = item

    if not upload_files:
        return None

    fd, archive_name = tempfile.mkstemp(prefix="next-typecho-uploads-", suffix=".tgz")
    os.close(fd)
    archive = Path(archive_name)
    with tarfile.open(archive, "w:gz") as output:
        for name, file_path in sorted(upload_files.items()):
            output.add(file_path, arcname=f"uploads/{name}", recursive=False)
    return archive


def build_remote_script(args: argparse.Namespace, *, sync_uploads: bool) -> str:
    q = shlex.quote
    uploads_step = ""
    if sync_uploads:
        uploads_step = f"""
if [ -d "$root/data/uploads" ]; then
  tar -C "$root/data" -czf "$backup/uploads.tgz" uploads
fi
rm -rf "$root/data/uploads"
tar -xzf {q(REMOTE_UPLOADS)} -C "$root/data"
chmod -R u+rwX,go+rX "$root/data/uploads"
rm -f {q(REMOTE_UPLOADS)}
"""

    remote_db = f"{args.remote_root}/data/prod.db"

    return f"""#!/usr/bin/env bash
set -euo pipefail

root={q(args.remote_root)}
domain={q(args.domain)}
site_url={q(f"https://{args.domain}")}
backup="$root/backups/data-sync-$(date +%Y%m%d%H%M%S)"
db="$root/data/prod.db"

cleanup() {{
  rm -f {q(REMOTE_DB)} {q(REMOTE_UPLOADS)}
}}
trap cleanup EXIT

echo '[1/5] 校验上传的 SQLite 快照'
node --input-type=module -e 'import {{ DatabaseSync }} from "node:sqlite"; const db = new DatabaseSync("{REMOTE_DB}"); const result = db.prepare("PRAGMA integrity_check").get().integrity_check; console.log("uploaded_integrity=" + result); db.close(); if (result !== "ok") process.exit(2);'

echo '[2/5] 停止服务并备份生产数据'
install -d -m 755 "$root/data" "$root/backups" "$backup"
systemctl stop next-typecho.service
if [ -f "$db" ]; then
  cp -a "$db" "$backup/prod.db"
fi
rm -f "$root/data/prod.db-wal" "$root/data/prod.db-shm"
{uploads_step}

echo '[3/5] 替换数据库并修正生产站点地址'
install -m 600 {q(REMOTE_DB)} "$db"
SITE_URL="$site_url" node --input-type=module -e 'import {{ DatabaseSync }} from "node:sqlite"; const db = new DatabaseSync("{remote_db}"); const before = db.prepare("PRAGMA integrity_check").get().integrity_check; console.log("before_update=" + before); if (before !== "ok") process.exit(3); db.prepare("UPDATE site_settings SET site_url = ?, updated_at = ? WHERE id = 1").run(process.env.SITE_URL, Date.now()); const after = db.prepare("PRAGMA integrity_check").get().integrity_check; console.log("after_update=" + after); db.close(); if (after !== "ok") process.exit(4);'

echo '[4/5] 启动服务'
systemctl start next-typecho.service
sleep 4
systemctl is-active --quiet next-typecho.service

echo '[5/5] 健康检查'
status=$(curl -ksS --resolve "$domain:443:127.0.0.1" -o /tmp/next-typecho-sync-home.html -w '%{{http_code}}' "https://$domain/")
printf 'https_http=%s\\n' "$status"
case "$status" in
  2*|3*) ;;
  *) echo 'HTTPS 健康检查失败。' >&2; exit 1 ;;
esac
printf 'backup=%s\\n' "$backup"
printf 'next-typecho=%s\\n' "$(systemctl is-active next-typecho.service)"
wc -c /tmp/next-typecho-sync-home.html
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--user", default=DEFAULT_USER)
    parser.add_argument("--identity", type=Path, default=DEFAULT_KEY)
    parser.add_argument("--remote-root", default=DEFAULT_REMOTE_ROOT)
    parser.add_argument("--domain", default=DEFAULT_DOMAIN)
    parser.add_argument("--local-db", type=Path, default=DEFAULT_LOCAL_DB)
    parser.add_argument("--skip-uploads", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not SAFE_DOMAIN.fullmatch(args.domain):
        raise SystemExit(f"域名包含不支持的字符: {args.domain}")

    project_dir = Path(__file__).resolve().parents[1]
    key = args.identity.expanduser()
    local_db = (project_dir / args.local_db).resolve() if not args.local_db.is_absolute() else args.local_db
    if not key.is_file():
        raise SystemExit(f"SSH 私钥不存在: {key}")
    if not local_db.is_file():
        raise SystemExit(f"本地数据库不存在: {local_db}")
    if not shutil.which("ssh") or not shutil.which("scp"):
        raise SystemExit("本机未找到 ssh/scp。")

    snapshot: Path | None = None
    uploads_archive: Path | None = None
    try:
        print("[本机] 生成 SQLite 一致性快照", flush=True)
        snapshot = make_sqlite_snapshot(local_db)
        print(f"[本机] 快照: {snapshot}", flush=True)

        if not args.skip_uploads:
            print("[本机] 打包上传目录", flush=True)
            uploads_archive = make_uploads_archive(project_dir)
            if uploads_archive:
                print(f"[本机] 上传包: {uploads_archive}", flush=True)
            else:
                print("[本机] 没有可同步的上传文件，跳过 uploads。", flush=True)

        print("[本机] 上传数据文件", flush=True)
        run([*scp_base(key), str(snapshot), f"{args.user}@{args.host}:{REMOTE_DB}"])
        if uploads_archive:
            run([*scp_base(key), str(uploads_archive), f"{args.user}@{args.host}:{REMOTE_UPLOADS}"])

        print("[远端] 同步数据并重启服务", flush=True)
        run(
            [*ssh_base(args.host, args.user, key), "bash", "-s"],
            input_text=build_remote_script(args, sync_uploads=bool(uploads_archive)),
        )
    except subprocess.CalledProcessError as exc:
        print(f"同步失败，命令退出码: {exc.returncode}", file=sys.stderr)
        return exc.returncode
    finally:
        if snapshot:
            snapshot.unlink(missing_ok=True)
        if uploads_archive:
            uploads_archive.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
