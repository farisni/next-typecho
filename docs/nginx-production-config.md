# Nginx 生产配置说明

本文记录 Next Typecho 生产环境的 Nginx 关键配置、设计原因、风险边界和排障方式。

## 1. 配置来源

本项目的 Nginx 配置由 `scripts/deploy.py` 生成，服务器上的落地文件为：

```text
/etc/nginx/conf.d/savor-manager.conf
```

部署脚本在覆盖配置前会生成带时间戳的备份：

```text
/etc/nginx/conf.d/savor-manager.conf.bak.YYYYMMDDHHMMSS
```

因此应优先修改部署脚本中的模板，不要只在服务器上手工修改生成文件，否则下次部署会覆盖手工改动。

## 2. 请求链路

```text
浏览器
  -> Nginx（TLS、压缩、静态文件、上传限制）
  -> Next.js（127.0.0.1:8000）
  -> SQLite / 上传目录 / 应用内缓存
```

职责划分：

- Nginx 负责 HTTPS、静态文件、连接管理和基础防护。
- Next.js 负责 SSR、登录态、主题、文章搜索缓存和业务逻辑。
- Nginx 不缓存动态页面，避免缓存登录态、主题预览或个性化响应。

## 3. 上游连接复用

```nginx
upstream next_typecho {
    server 127.0.0.1:8000;
    keepalive 16;
}
```

反向代理统一使用：

```nginx
proxy_pass http://next_typecho;
```

配置原因：

- Nginx 与本机 Next.js 之间复用 TCP 连接，减少频繁建立连接的开销。
- `keepalive 16` 足够覆盖当前单机博客的并发，又不会为低流量站点保留过多空闲连接。
- 使用具名 `upstream`，后续扩展多个 Next.js 实例时不需要重写所有 `location`。

不建议盲目把连接池改成几百或几千。连接池不是越大越快，过大的空闲连接会浪费文件描述符和内存。

## 4. HTTP 与 WebSocket 连接头

```nginx
map $http_upgrade $connection_upgrade_next_typecho {
    default upgrade;
    "" "";
}
```

代理请求中使用：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade_next_typecho;
```

配置原因：

- 普通 HTTP 请求不强制发送 `Connection: close`，允许连接复用。
- 存在 `Upgrade` 请求头时仍支持 WebSocket 或类似协议升级。
- 比固定写死 `Connection "upgrade"` 更准确，避免所有普通请求都携带无意义的升级头。

## 5. 文本压缩

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 5;
gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    application/xml
    image/svg+xml;
```

配置原因：

- 压缩 HTML、CSS、JavaScript、JSON、XML 和 SVG，降低传输带宽。
- `gzip_min_length 1024` 避免压缩过小响应，防止压缩成本大于收益。
- `gzip_comp_level 5` 在 CPU 消耗和压缩率之间保持克制，不追求极限压缩。
- `gzip_vary on` 添加 `Vary: Accept-Encoding`，避免中间缓存混用压缩与未压缩响应。

JPEG、PNG、WebP、视频和压缩包本身已经压缩，不应再次加入 `gzip_types`，否则只会增加 CPU 压力。

## 6. 图片上传限制

```nginx
client_max_body_size 10m;
client_body_timeout 30s;
```

配置原因：

- 文章编辑器粘贴图片时，请求必须先通过 Nginx 才能交给 Sharp 压缩。
- `10m` 允许常见相机截图和原图上传，同时限制异常大请求占用带宽、磁盘和 Sharp 处理资源。
- `client_body_timeout 30s` 防止客户端长时间占用上传连接。

注意：

- `client_max_body_size` 限制的是压缩前的上传文件。
- Sharp 负责处理后的图片体积，不能替代 Nginx 的入口大小限制。
- 如果业务确实需要上传大于 10 MB 的图片，应同时评估带宽、Sharp 内存峰值和应用接口限制，而不是只修改 Nginx。

## 7. 静态资源缓存

### 7.1 Next.js 构建资源

```nginx
location /_next/static/ {
    alias /opt/next-typecho/current/.next/static/;
    access_log off;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Static-Cache "HIT" always;
}
```

配置原因：

- `/_next/static/` 文件名包含内容哈希，内容变化后 URL 也会变化。
- 因此可以安全使用一年缓存和 `immutable`。
- Nginx 直接读取文件，不再经过 Next.js，显著减少 Node.js 请求数和内存压力。
- 关闭静态资源访问日志，减少高频小文件请求产生的磁盘写入。

### 7.2 上传图片

```nginx
location /uploads/ {
    alias /opt/next-typecho/data/uploads/;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400";
    add_header X-Static-Cache "HIT" always;
}
```

配置原因：

- 上传图片由 Nginx 直接提供，不占用 Next.js 进程。
- 30 天浏览器缓存可明显降低图片带宽和服务器读取压力。
- `stale-while-revalidate=86400` 允许客户端在重新验证期间继续使用旧资源，改善弱网体验。
- 上传目录未使用一年 `immutable`，为替换或修复同 URL 文件保留余地。

### 7.3 图标等普通静态文件

```nginx
location ~* ^/(favicon\.ico|favicon\.png|favicon\.svg|apple-touch-icon\.png)$ {
    root /opt/next-typecho/current/public;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

此类资源没有 Next.js 构建哈希，因此使用 30 天缓存，而不是 `immutable`。

## 8. 动态请求代理

```nginx
location / {
    proxy_pass http://next_typecho;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade_next_typecho;

    proxy_connect_timeout 3s;
    proxy_send_timeout 70s;
    proxy_read_timeout 70s;
    proxy_buffering off;
}
```

关键参数说明：

| 参数 | 当前值 | 原因 |
| --- | --- | --- |
| `proxy_connect_timeout` | `3s` | Next.js 位于本机，本机连接超过 3 秒基本可判定应用异常，应快速失败。 |
| `proxy_send_timeout` | `70s` | 给上传和较慢请求保留合理时间。 |
| `proxy_read_timeout` | `70s` | 允许较慢 SSR 或接口完成，但不无限占用连接。 |
| `proxy_buffering` | `off` | 保留 Next.js 流式响应能力，减少首字节被 Nginx 缓冲延迟。 |
| `X-Real-IP` | 客户端地址 | 供访问统计和日志识别来源 IP。 |
| `X-Forwarded-For` | 代理链 | 保留完整代理链路。 |
| `X-Forwarded-Proto` | HTTP/HTTPS | 让应用正确识别原始协议。 |

## 9. 为什么不启用动态页面 `proxy_cache`

当前配置只缓存静态文件，不对 `/`、文章页或 API 启用 Nginx `proxy_cache`。

原因：

- 前台包含登录态、博主专属访问统计、评论和主题状态。
- 发布、修改、删除文章后，Next.js 内部会主动重建文章与搜索缓存。
- 再增加一层 Nginx 动态缓存会形成两个失效体系，容易出现文章已更新但页面仍旧、登录态串用或评论不及时等问题。
- 博客动态响应量不大，当前更值得优化的是静态资源直出和应用内数据缓存。

如果以后确实需要动态缓存，应先明确：

- 哪些 URL 可以公开缓存。
- 哪些 Cookie 或请求头必须绕过缓存。
- 发布、修改、删除、评论后如何主动清理缓存。
- 404、500、登录页和后台接口不得进入公共缓存。

在这些规则未完整建立前，不应启用全站 `proxy_cache`。

## 10. HTTPS 与域名收口

生产配置应满足：

- HTTP 统一重定向到 HTTPS。
- 非主域名统一重定向到主域名。
- TLS 证书由 Certbot 管理。
- 应用只监听本机 `127.0.0.1:8000`，不直接暴露到公网。

这样可以避免重复内容、Cookie 域名混乱和 Node.js 端口被绕过 Nginx 直接访问。

## 11. 不在项目脚本中修改的全局参数

以下参数通常位于 `/etc/nginx/nginx.conf`，属于服务器级配置，不由本项目部署脚本接管：

```nginx
worker_processes auto;

events {
    worker_connections 2048;
}
```

对于当前单机博客，系统发行版默认值通常已经足够。只有在出现文件描述符不足、连接数瓶颈或明确压测证据时才调整，不应为了“看起来性能更高”随意放大。

## 12. 配置变更流程

每次调整 Nginx 后按以下顺序操作：

```bash
nginx -t
systemctl reload nginx
```

不要在 `nginx -t` 失败时重载。

检查实际加载配置：

```bash
nginx -T
```

检查服务状态和近期错误：

```bash
systemctl status nginx
journalctl -u nginx -n 100 --no-pager
tail -n 100 /var/log/nginx/error.log
```

## 13. 验收清单

### 静态资源

```bash
curl -I https://www.farisni.com/_next/static/实际文件路径
curl -I https://www.farisni.com/uploads/实际图片路径
```

应重点检查：

- 返回码为 `200`。
- `Cache-Control` 与预期一致。
- `/_next/static/` 包含 `immutable`。
- 响应包含 `X-Static-Cache: HIT`。

### 压缩

```bash
curl -I -H 'Accept-Encoding: gzip' https://www.farisni.com/
```

文本响应应出现：

```text
Content-Encoding: gzip
Vary: Accept-Encoding
```

### 上传

- 小于 10 MB 的合法图片可以上传并由 Sharp 正常处理。
- 大于 10 MB 的请求应被 Nginx 拒绝。
- 上传失败时同时检查 Nginx `413`、应用接口限制和 Sharp 错误。

### 应用代理

```bash
curl -I https://www.farisni.com/
curl -I https://www.farisni.com/posts/实际文章-slug
```

应确认首页和文章页可正常访问，登录、评论、搜索和后台接口没有被缓存。

## 14. 回滚方式

如新配置异常，先查找最近备份：

```bash
ls -lt /etc/nginx/conf.d/savor-manager.conf*
```

恢复备份后必须再次检查并重载：

```bash
cp /etc/nginx/conf.d/savor-manager.conf.bak.时间戳 /etc/nginx/conf.d/savor-manager.conf
nginx -t
systemctl reload nginx
```

回滚服务器文件只能临时恢复服务。确认问题后还应同步修正 `scripts/deploy.py`，否则下次部署会再次生成错误配置。

## 15. 调优原则

- 先看日志和指标，再改参数。
- 优先减少经过 Node.js 的静态请求。
- 优先限制异常大上传和超长连接。
- 不为低流量站点设置过大的连接池和缓存区。
- 不在缺少失效策略时缓存动态页面。
- 每次只改一类参数，并保留可回滚配置。
