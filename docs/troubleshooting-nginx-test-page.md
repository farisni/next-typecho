# 故障排除：Nginx 返回测试页而非 Next.js（2026-07-26）

## 现象

- 浏览器访问 `https://www.farisni.com` 返回 CentOS 默认 **HTTP Server Test Page**（Nginx 欢迎页）
- curl 本地 `http://127.0.0.1:8000` 正常返回 Next.js 页面
- 域名 DNS 解析正确，能连上服务器

## 根因

**不是 Apache/httpd**，问题在 Nginx 配置的 `try_files` 指令：

```nginx
location / {
    try_files $uri $uri/ @next_proxy;
}
```

`$uri/` 匹配目录时，Nginx 继承默认的 `index index.html`，在 `/usr/share/nginx/html/` 找到了 CentOS 自带的测试页直接返回——请求根本没落到 `@next_proxy` 反代。

## 修复

### 1. 去掉 `$uri/`

```nginx
location / {
    try_files $uri @next_proxy;
}
```

### 2. 修复 Nginx 缓存目录权限

```bash
chown -R nginx:nginx /var/cache/nginx/next_typecho
chmod -R 750 /var/cache/nginx
systemctl reload nginx
```

缓存目录权限不足会导致 Nginx error log 持续刷 `Permission denied`，静态资源缓存在读取时失败。

### 3. 重载验证

```bash
nginx -t && systemctl reload nginx
curl -ksSI --resolve www.farisni.com:443:127.0.0.1 https://www.farisni.com/
```

预期响应头出现 `X-Powered-By: Next.js`，且 `Content-Type: text/html; charset=utf-8`。

### 4. 源码修复

`scripts/deploy.py` 第 268 行已同步修改，下次部署不会复现。

## 诊断步骤（复现此类问题时使用）

```bash
# 1. 确认 80/443 由谁监听
ss -tlnp 'sport = :80 or sport = :443'

# 2. 确认 Next.js 存活
systemctl is-active next-typecho.service
curl -sS http://127.0.0.1:8000/ | head -c 200

# 3. 比对 127.0.0.1 直连 vs 域名走 Nginx 的响应
curl -sS http://127.0.0.1:8000/ | head -c 200
curl -ksS --resolve www.farisni.com:443:127.0.0.1 https://www.farisni.com/ | head -c 200

# 4. 定位是哪个 server 块 / root 路径在生效
grep -n "root\|server_name\|location /" /etc/nginx/conf.d/*.conf /etc/nginx/nginx.conf

# 5. 检查错误日志
tail -50 /var/log/nginx/error.log
```

## 关键区分：Apache vs Nginx

| 检查方式 | Apache（httpd）迹象 | Nginx 默认测试页迹象 |
|---|---|---|
| `ss -tlnp sport = 80` | `users:("httpd")` | `users:("nginx")` |
| `systemctl is-active httpd` | `active` | `inactive` |
| 响应 `Server` 头 | `Apache/2.x` | `nginx` |
| 测试页内容 | "Testing 123.." | "HTTP Server Test Page" + "nginx" logo |

## 相关文档

- [[deployment.md]] — 部署流程与架构
- [[astro-like-static-rendering.md]] — Astro 风格静态渲染方案
