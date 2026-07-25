# 部署说明

## 背景

生产服务器使用 Node.js 24、systemd、Nginx 和 SQLite。服务器资源有限，Next.js 构建阶段可能占用较多内存，因此部署脚本把生产构建放在开发机完成，服务器只安装 Linux 运行依赖并启动构建产物。

## 使用方式

在项目根目录执行：

```bash
python3 scripts/deploy.py
```

脚本默认部署到 `8.134.150.114` 的 `/opt/next-typecho`，使用 `~/.ssh/id_ed25519`，域名为 `www.farisni.com`，npm 依赖源为 `https://registry.npmmirror.com`。

需要替换生产环境文件时：

```bash
python3 scripts/deploy.py --env-file .env.production
```

也可以通过 `--host`、`--identity`、`--remote-root`、`--domain` 和 `--npm-registry` 覆盖默认参数。

## 部署流程

- 本机执行 `pnpm exec next build --webpack`；
- 打包 `.next` 和源码，排除 `.git`、`node_modules`、`data`、上传文件及环境文件；
- 服务器执行 `pnpm install --frozen-lockfile`，不执行 `next build`；
- 执行 Drizzle migration，SQLite 数据保存在 release 目录之外；
- 切换 `/opt/next-typecho/current`，启动 `next-typecho.service`；
- 配置 `www.farisni.com` HTTPS，旧域名 `savor.farisni.com` 跳转到新域名；
- 检查 HTTPS 首页、systemd 状态和旧 `savor-manager` 服务状态。

## 验证结果

部署成功时，脚本会输出 `https_http=200` 或其他 2xx/3xx 状态、当前 release 路径以及两个 systemd 服务状态。

## 风险与约束

- 本机构建环境应使用与服务器兼容的 Node.js 24 和 pnpm 10；服务器会重新安装 Linux 依赖，不能直接上传 macOS `node_modules`。
- `data/` 和 `public/uploads` 永远不随构建包上传，生产数据库和上传文件由 `/opt/next-typecho/data` 持久化。
- HTTPS 证书申请依赖域名 DNS 已指向服务器；证书不存在或不包含目标域名时，脚本会在切换服务前失败。
- 脚本会停止并禁用同机旧的 `savor-manager.service`，因为两个应用都使用 8000 端口。
