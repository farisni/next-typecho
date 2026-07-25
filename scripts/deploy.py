#!/usr/bin/env python3
"""在本机构建并部署 Next Typecho。

服务器只安装 Linux 运行依赖，不执行 next build；生产构建由本机完成。

示例：
    python3 scripts/deploy.py
    python3 scripts/deploy.py --env-file .env.production
"""

from __future__ import annotations

import argparse
import os
import re
import shlex
import shutil
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
DEFAULT_APEX_DOMAIN = "farisni.com"
DEFAULT_LEGACY_DOMAIN = "savor.farisni.com"
DEFAULT_CERT_NAME = "savor.farisni.com"
DEFAULT_NPM_REGISTRY = "https://registry.npmmirror.com"
REMOTE_PACKAGE = "/tmp/next-typecho-deploy.tgz"
REMOTE_ENV = "/tmp/next-typecho-env"
SAFE_DOMAIN = re.compile(r"^[A-Za-z0-9.-]+$")


def run(command: list[str], *, cwd: Path | None = None, input_text: str | None = None) -> None:
    # 命令失败立即终止，避免切换到不完整的 release。
    print("+", " ".join(shlex.quote(part) for part in command), flush=True)
    subprocess.run(command, cwd=cwd, input=input_text, text=True, check=True)


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


def should_exclude(relative_path: Path) -> bool:
    parts = relative_path.parts
    if not parts:
        return False
    if any(part in {".git", "node_modules", "data"} for part in parts):
        return True
    if len(parts) >= 2 and parts[:2] in (("public", "uploads"), (".next", "cache")):
        return True
    if relative_path.name.startswith(".env"):
        return True
    return relative_path.name.startswith("._") or relative_path.name == ".DS_Store"


def make_archive(project_dir: Path) -> Path:
    # tarfile 不会把 macOS extended attributes 写成远端的 ._ 元数据文件。
    fd, archive_name = tempfile.mkstemp(prefix="next-typecho-", suffix=".tgz")
    os.close(fd)
    archive = Path(archive_name)
    with tarfile.open(archive, "w:gz") as output:
        for root, directories, files in os.walk(project_dir):
            root_path = Path(root)
            relative_root = root_path.relative_to(project_dir)
            directories[:] = [
                name for name in directories
                if not should_exclude(relative_root / name)
            ]
            for name in files:
                file_path = root_path / name
                relative_path = file_path.relative_to(project_dir)
                if not should_exclude(relative_path):
                    output.add(file_path, arcname=relative_path.as_posix(), recursive=False)
    return archive


def validate_options(args: argparse.Namespace) -> None:
    for label, value in (("主域名", args.domain), ("裸域名", args.apex_domain), ("旧域名", args.legacy_domain), ("证书名称", args.cert_name)):
        if not SAFE_DOMAIN.fullmatch(value):
            raise SystemExit(f"{label}包含不支持的字符: {value}")


def build_remote_script(args: argparse.Namespace, *, env_file: bool) -> str:
    q = shlex.quote
    if env_file:
        env_setup = f"""
if [ ! -s {q(REMOTE_ENV)} ]; then
  echo '上传的环境文件为空。' >&2
  exit 1
fi
install -m 600 {q(REMOTE_ENV)} "$release/.env.production"
rm -f {q(REMOTE_ENV)}
"""
    else:
        env_setup = """
if [ -f "$current/.env.production" ]; then
  install -m 600 "$current/.env.production" "$release/.env.production"
else
  printf '%s\\n' 'DATABASE_URL="'$root'/data/prod.db"' > "$release/.env.production"
  chmod 600 "$release/.env.production"
fi
"""

    return f"""#!/usr/bin/env bash
set -euo pipefail

root={q(args.remote_root)}
package={q(REMOTE_PACKAGE)}
current="$root/current"
releases="$root/releases"
release="$releases/$(date +%Y%m%d%H%M%S%N)"
registry={q(args.npm_registry)}
domain={q(args.domain)}
apex_domain={q(args.apex_domain)}
site_url={q(f"https://{args.domain}")}
legacy_domain={q(args.legacy_domain)}
cert_name={q(args.cert_name)}
switched=0

cleanup() {{
  rm -f "$package" {q(REMOTE_ENV)}
  if [ "$switched" -eq 0 ]; then rm -rf "$release"; fi
}}
trap cleanup EXIT

echo '[1/7] 准备 release 和生产环境'
install -d -m 755 "$releases" "$root/data" "$root/data/uploads" "$root/logs"
install -d -m 755 "$release"
tar -xzf "$package" -C "$release"
find "$release" -name '._*' -type f -delete
{env_setup}
rm -rf "$release/public/uploads"
ln -s "$root/data/uploads" "$release/public/uploads"
cd "$release"

echo '[2/7] 安装 Linux 运行依赖（不执行构建）'
export npm_config_registry="$registry"
if ! command -v pnpm >/dev/null 2>&1; then
  npm install --global --no-audit --no-fund --registry="$registry" pnpm@10.34.5
fi
pnpm install --frozen-lockfile --reporter=append-only

echo '[3/7] 执行数据库 migration'
set -a
source "$release/.env.production"
set +a
pnpm db:migrate
node --input-type=module -e 'import {{ DatabaseSync }} from "node:sqlite"; const db = new DatabaseSync(process.env.DATABASE_URL); db.prepare("DELETE FROM _migrations WHERE name LIKE ?").run("._%"); db.close();'
# 通过环境变量传入已校验的域名，避免 Node 的全局 domain 对象被误插入 URL。
SITE_URL="$site_url" node --input-type=module -e 'import {{ DatabaseSync }} from "node:sqlite"; const db = new DatabaseSync(process.env.DATABASE_URL); db.prepare("UPDATE site_settings SET site_url = ?, updated_at = ? WHERE id = 1").run(process.env.SITE_URL, Date.now()); db.close();'

echo '[4/7] 校验本机构建产物'
test -s "$release/.next/BUILD_ID"
test -x "$release/node_modules/.bin/next"

echo '[5/7] 配置 HTTPS 和 Nginx'
certificate="/etc/letsencrypt/live/$cert_name/fullchain.pem"
certificate_key="/etc/letsencrypt/live/$cert_name/privkey.pem"
if [ ! -s "$certificate" ] \
  || ! openssl x509 -in "$certificate" -noout -text | grep -q "DNS:$legacy_domain" \
  || ! openssl x509 -in "$certificate" -noout -text | grep -q "DNS:$domain" \
  || ! openssl x509 -in "$certificate" -noout -text | grep -q "DNS:$apex_domain"; then
  certbot certonly --nginx --non-interactive --agree-tos --no-eff-email \\
    --expand --cert-name "$cert_name" -d "$legacy_domain" -d "$domain" -d "$apex_domain"
fi
if [ ! -s "$certificate" ] || [ ! -s "$certificate_key" ]; then
  echo 'HTTPS 证书不存在，停止部署。' >&2
  exit 1
fi
if [ -f /etc/nginx/conf.d/savor-manager.conf ]; then
  cp /etc/nginx/conf.d/savor-manager.conf "/etc/nginx/conf.d/savor-manager.conf.bak.$(date +%Y%m%d%H%M%S)"
fi
cat > /etc/nginx/conf.d/savor-manager.conf <<'NGINX'
proxy_cache_path /var/cache/nginx/next_typecho levels=1:2 keys_zone=next_typecho_static:20m max_size=1g inactive=1d use_temp_path=off;

map $http_upgrade $connection_upgrade_next_typecho {{
    default upgrade;
    ""      close;
}}
server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {args.domain} {args.apex_domain};
    ssl_certificate /etc/letsencrypt/live/{args.cert_name}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{args.cert_name}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    if ($host = "{args.apex_domain}") {{
        return 301 https://{args.domain}$request_uri;
    }}
    client_max_body_size 1m;
    location ^~ /_next/static/ {{
        alias /opt/next-typecho/current/.next/static/;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Static-Cache HIT always;
    }}

    location ^~ /uploads/ {{
        alias /opt/next-typecho/data/uploads/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400";
    }}

    location /favicon.ico {{
        root /opt/next-typecho/current/public;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }}

    location /robots.txt {{
        root /opt/next-typecho/current/public;
        access_log off;
        try_files $uri =404;
    }}

    location /static/ {{
        root /opt/next-typecho/current/public;
        access_log off;
        try_files $uri @next_proxy;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }}

    location @next_proxy {{
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade_next_typecho;
        proxy_connect_timeout 10s;
        proxy_send_timeout 70s;
        proxy_read_timeout 70s;
        proxy_buffering off;
        proxy_cache next_typecho_static;
        proxy_cache_methods GET HEAD;
        proxy_cache_valid 200 301 302 304 10m;
        add_header X-Static-Cache $upstream_cache_status always;
    }}

    location / {{
        try_files $uri $uri/ @next_proxy;
    }}
}}
server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {args.legacy_domain};
    ssl_certificate /etc/letsencrypt/live/{args.cert_name}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{args.cert_name}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    return 301 https://{args.domain}$request_uri;
}}
server {{
    listen 80;
    listen [::]:80;
server_name {args.domain} {args.legacy_domain} {args.apex_domain};
    return 301 https://{args.domain}$request_uri;
}}
NGINX
nginx -t
systemctl reload nginx

echo '[6/7] 切换 release 并启动服务'
systemctl stop savor-manager.service >/dev/null 2>&1 || true
systemctl disable savor-manager.service >/dev/null 2>&1 || true
install -d -m 750 /var/log/next-typecho
cat > /etc/systemd/system/next-typecho.service <<'UNIT'
[Unit]
Description=Next Typecho Blog
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/next-typecho/current
Environment=NODE_ENV=production
EnvironmentFile=/opt/next-typecho/current/.env.production
ExecStart=/opt/next-typecho/current/node_modules/.bin/next start -p 8000
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/next-typecho/application.log
StandardError=append:/var/log/next-typecho/error.log

[Install]
WantedBy=multi-user.target
UNIT
ln -sfn "$release" "$current"
switched=1
systemctl daemon-reload
systemctl enable next-typecho.service >/dev/null
systemctl restart next-typecho.service
sleep 4
systemctl is-active --quiet next-typecho.service

echo '[7/7] 健康检查'
status=$(curl -ksS --resolve "$domain:443:127.0.0.1" -o /dev/null -w '%{{http_code}}' "https://$domain/")
printf 'https_http=%s\\n' "$status"
case "$status" in
  2*|3*) ;;
  *) echo 'HTTPS 健康检查失败。' >&2; exit 1 ;;
esac
printf 'current=%s\\n' "$(readlink -f "$current")"
printf 'next-typecho=%s\\n' "$(systemctl is-active next-typecho.service)"
printf 'savor-manager=%s\\n' "$(systemctl is-active savor-manager.service || true)"
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--user", default=DEFAULT_USER)
    parser.add_argument("--identity", type=Path, default=DEFAULT_KEY)
    parser.add_argument("--remote-root", default=DEFAULT_REMOTE_ROOT)
    parser.add_argument("--domain", default=DEFAULT_DOMAIN)
    parser.add_argument("--apex-domain", default=DEFAULT_APEX_DOMAIN)
    parser.add_argument("--legacy-domain", default=DEFAULT_LEGACY_DOMAIN)
    parser.add_argument("--cert-name", default=DEFAULT_CERT_NAME)
    parser.add_argument("--npm-registry", default=os.environ.get("NPM_REGISTRY", DEFAULT_NPM_REGISTRY))
    parser.add_argument("--env-file", type=Path, help="替换远端 .env.production")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    validate_options(args)
    project_dir = Path(__file__).resolve().parents[1]
    key = args.identity.expanduser()
    if not shutil.which("pnpm"):
        raise SystemExit("本机未找到 pnpm，请先安装 pnpm 10。")
    if not key.is_file():
        raise SystemExit(f"SSH 私钥不存在: {key}")
    if args.env_file and not args.env_file.is_file():
        raise SystemExit(f"环境文件不存在: {args.env_file}")

    try:
        print("[本机] 生成生产构建（webpack）", flush=True)
        run(["pnpm", "exec", "next", "build", "--webpack"], cwd=project_dir)
        archive = make_archive(project_dir)
        try:
            run([*scp_base(key), str(archive), f"{args.user}@{args.host}:{REMOTE_PACKAGE}"])
        finally:
            archive.unlink(missing_ok=True)
        if args.env_file:
            run([*scp_base(key), str(args.env_file), f"{args.user}@{args.host}:{REMOTE_ENV}"])
        run(
            [*ssh_base(args.host, args.user, key), "bash", "-s"],
            input_text=build_remote_script(args, env_file=bool(args.env_file)),
        )
    except subprocess.CalledProcessError as exc:
        print(f"部署失败，命令退出码: {exc.returncode}", file=sys.stderr)
        return exc.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
