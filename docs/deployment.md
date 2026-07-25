# 部署说明

## 背景

生产服务器使用 Node.js 24、systemd、Nginx 和 SQLite。服务器资源有限，Next.js 构建阶段可能占用较多内存，因此部署脚本把生产构建放在开发机完成，服务器只安装 Linux 运行依赖并启动构建产物。

## 使用方式

在项目根目录执行：

```bash
python3 scripts/deploy.py
```

脚本默认部署到 `8.134.150.114` 的 `/opt/next-typecho`，使用 `~/.ssh/id_ed25519`，主域名为 `www.farisni.com`，裸域 `farisni.com` 与旧域名 `savor.farisni.com` 都会重定向到主域名，npm 依赖源为 `https://registry.npmmirror.com`。

需要替换生产环境文件时：

```bash
python3 scripts/deploy.py --env-file .env.production
```

也可以通过 `--host`、`--identity`、`--remote-root`、`--domain`、`--apex-domain` 和 `--npm-registry` 覆盖默认参数。

## 部署流程

- 本机执行 `pnpm exec next build --webpack`；
- 打包 `.next` 和源码，排除 `.git`、`node_modules`、`data`、上传文件及环境文件；
- 服务器执行 `pnpm install --frozen-lockfile`，不执行 `next build`；
- 执行 Drizzle migration，SQLite 数据保存在 release 目录之外；
- 切换 `/opt/next-typecho/current`，启动 `next-typecho.service`；
- 申请同时覆盖 `www.farisni.com`、`farisni.com` 和 `savor.farisni.com` 的 HTTPS 证书，并将裸域及旧域名跳转到主域名；
- 检查 HTTPS 首页、systemd 状态和旧 `savor-manager` 服务状态。

更多性能与 QPS 调优请见：[服务性能调优沉淀](qps-and-node-memory.md)。

## 验证结果

部署成功时，脚本会输出 `https_http=200` 或其他 2xx/3xx 状态、当前 release 路径以及两个 systemd 服务状态。

## 风险与约束

- 本机构建环境应使用与服务器兼容的 Node.js 24 和 pnpm 10；服务器会重新安装 Linux 依赖，不能直接上传 macOS `node_modules`。
- `data/` 和 `public/uploads` 永远不随构建包上传，生产数据库和上传文件由 `/opt/next-typecho/data` 持久化。
- HTTPS 证书申请依赖域名 DNS 已指向服务器；证书不存在或不包含目标域名时，脚本会在切换服务前失败。
- 脚本会停止并禁用同机旧的 `savor-manager.service`，因为两个应用都使用 8000 端口。

## 故障沉淀：farisni.com 显示 "Not secure"

### 现象

- 访问 `https://farisni.com` 证书警告，提示不安全；
- 但 `https://www.farisni.com` 可正常访问。

### 根因

`farisni.com` 在 TLS 阶段没有匹配到 `server_name` 或者证书 SAN 不包含裸域。
因为裸域未参与证书申请/续期时，浏览器会先在握手阶段判定证书不匹配，页面即使后续重定向到 `www` 仍会报警。

### 已做修复

- `scripts/deploy.py` 新增 `--apex-domain` 参数（默认 `farisni.com`）；
- 证书检查/续期时强制校验并申请 `legacy + www + apex` 三个域名；
- Nginx 443 配置保留 `www` 与 `legacy/apex` 两个 HTTPS server，并且裸域 HTTPS 301 到 `https://www.farisni.com`；
- HTTP 监听块也统一重定向上述三类域名。

### 复现与验证口径（建议）

1. 重新执行部署，确认脚本输出中证书逻辑通过。
2. 用浏览器访问 `https://farisni.com`，应直接进入 `https://www.farisni.com`，且无证书告警。
3. 若再次出现异常，检查 `/etc/letsencrypt/live/savor.farisni.com/fullchain.pem` 的 SAN 是否包含 `DNS:farisni.com` 与 `DNS:www.farisni.com`，以及 Nginx `savor-manager.conf` 中 443 server_name 是否同时包含对应域名。

### 注意

- HTTPS 重定向依赖 DNS 生效和 Cloudflare / 上游代理的 SSL 模式设置；如中间层有托管证书，也会影响终端显示。
