# Next Typecho

一个使用 Next.js 复刻 Typecho 核心内容体验的轻量博客 CMS。当前目标是先完成“创建内容 → 发布 → 前台阅读”的最小闭环。

## 技术栈

- Next.js 16.2（App Router）
- React 19 + TypeScript 严格模式
- Tailwind CSS 4
- Drizzle Schema/migration + Node.js 内置 SQLite
- Zod 服务端数据验证
- React Markdown + GFM + Rehype Sanitize
- pnpm 10

选择 Drizzle Schema 和 Node.js 内置 SQLite，而不是 Prisma 或 `better-sqlite3`，是因为当前网络无法访问外部引擎及原生模块下载域名。运行时不依赖额外数据库二进制，可以离线启动。

## 已搭建功能

- 文章创建、编辑、删除
- 草稿、公开、待审核、隐藏和私密状态
- Markdown 双栏实时预览
- Markdown 服务端安全渲染，原始 HTML 不会直接执行
- 分类和标签管理（含全选与批量删除）
- JPG、PNG、GIF、WebP 本地上传，单文件最大 5 MB
- 首页、文章详情、分类归档和标签归档
- 分页、加载状态、空状态、错误页和 404
- 站点名称、描述、每页文章数设置
- 复刻 Typecho 默认主题的响应式前台排版
- 复刻 Typecho 原版管理后台的顶部菜单、控制台、列表、写作和设置界面
- 原版文章管理交互：状态标签、关键词/分类筛选、分页、整行选择、全选/半选及批量删除/标记
- Typecho 风格的管理员登录、记住登录、登录后回跳和退出
- 数据库会话与全部后台 Server Action 权限校验
- Typecho 原版风格的三步首次安装向导、环境检测与重复安装保护
- Typecho 原版“外观”管理：Default/Classic 22 切换、会话级预览、主题设置和 custom.css 编辑
- Typecho 原版“个人设置”：Gravatar、个人资料、撰写偏好、默认文章权限和密码修改

## 快速开始

需要 Node.js 24 或更高版本及 pnpm 10。项目使用了 Node.js 内置的 `node:sqlite`。

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

首次打开 http://localhost:3000 时会自动进入安装程序：

1. 检查 Node.js、migration、数据库目录和上传目录；
2. 初始化内置 SQLite 数据库，可在检测到旧数据时选择保留或清空；
3. 填写站点地址、管理员用户名、密码和邮箱，完成后自动建立登录会话。

安装程序会写入默认分类、欢迎文章、站点设置和首个管理员。安装标记最后在同一事务中写入，失败不会留下半安装状态；安装完成后再次访问 `/install` 会返回站点首页。

如果只想快速建立开发示例数据，也可以在启动前执行：

```powershell
pnpm db:migrate
pnpm db:seed
```

访问：

- 前台：http://localhost:3000
- 登录：http://localhost:3000/login
- 管理后台：http://localhost:3000/admin
- 新建文章：http://localhost:3000/admin/posts/new
- 个人设置：http://localhost:3000/admin/profile
- 外观管理：http://localhost:3000/admin/themes

仅使用 `pnpm db:seed` 时，未修改 `.env` 的本地管理员账号为：

- 用户名：`admin`（也可使用邮箱 `admin@example.com`）
- 密码：`typecho-admin`

正式部署若使用 seed，必须先在 `.env` 中修改 `ADMIN_USERNAME`、`ADMIN_EMAIL` 和 `ADMIN_PASSWORD`。对于已经有内容的数据库，可以执行 `pnpm db:migrate` 和 `pnpm db:seed-admin`；首次安装向导则会直接使用页面中填写的管理员信息。

数据库保存在 `data/dev.db`，上传图片保存在 `public/uploads`。两者均已被 Git 忽略。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 启动开发服务器 |
| `pnpm lint` | 运行 ESLint |
| `pnpm typecheck` | 生成路由类型并检查 TypeScript |
| `pnpm build` | 生成生产构建 |
| `pnpm db:generate` | 根据 Schema 生成 SQL migration |
| `pnpm db:migrate` | 执行尚未应用的 migration |
| `pnpm db:seed` | 重置并写入本地示例数据 |
| `pnpm db:seed-admin` | 为现有数据库创建首个管理员，不重置内容 |
| `pnpm verify:install` | 使用临时 SQLite 验证完整首次安装状态机 |
| `pnpm verify:post-management` | 使用临时 SQLite 验证文章筛选、状态计数和批量操作 |
| `pnpm verify:profile` | 使用临时 SQLite 验证资料、撰写偏好和密码修改 |
| `pnpm verify:themes` | 使用临时 SQLite 验证主题切换、配置和自定义 CSS |

## 目录结构

```text
src/
├─ actions/                 # Server Actions：认证、文章、分类、标签、设置和上传
├─ app/
│  ├─ (site)/               # 前台路由组，不影响最终 URL
│  ├─ admin/                # 管理后台
│  │  └─ themes/            # 外观列表、设置和安全编辑器
│  ├─ install/              # Typecho 风格首次安装向导
│  ├─ login/                # Typecho 风格登录页
│  ├─ error.tsx             # 全局错误状态
│  └─ not-found.tsx         # 404
├─ components/
│  ├─ admin/                # 后台表单
│  ├─ markdown/             # 编辑、预览和安全渲染
│  ├─ site/                 # Default 主题组件
│  └─ themes/               # 主题壳与 Classic 22 组件
├─ db/schema.ts             # Drizzle 数据模型和关系
└─ lib/
   ├─ auth/                 # 密码哈希、Cookie 与数据库会话
   ├─ bootstrap/            # migration、安装状态和初始化事务
   ├─ repositories/         # 集中的数据库读取
   ├─ storage/              # 可替换的图片存储接口
   ├─ themes/               # 内置主题注册表、请求解析和切换服务
   └─ validation/           # Zod Schema
drizzle/
├─ migrations/              # 生成的 SQL migration
└─ seed.ts                  # 示例数据
data/                        # 本地 SQLite 数据库，不提交
```

## 数据流说明

### Server Component

前台和后台列表页面默认是 Server Component。页面在服务器调用 repository 读取 SQLite，只把渲染结果发送给浏览器，因此数据库驱动不会进入前端 JavaScript。

### Server Action

后台表单通过 Server Action 写入数据。执行流程为：

1. 浏览器提交 `FormData`；
2. Server Action 使用 Zod 重新验证输入；
3. Node.js 内置 SQLite 驱动执行参数化 SQL；
4. `revalidatePath()` 让受影响页面重新读取数据；
5. 创建或编辑文章后跳转到文章列表。

客户端输入约束不能代替第 2 步，因为请求可以绕过浏览器表单直接发送。

### 登录与会话

登录支持用户名或邮箱。密码使用 Node.js 原生 `scrypt` 加随机盐保存，不在数据库保存明文；浏览器 Cookie 只保存随机会话令牌，SQLite 只保存该令牌的 SHA-256 摘要。

- 普通登录：Cookie 随浏览器会话结束，服务端会话最长 12 小时；
- “下次自动登录”：Cookie 和服务端会话有效期均为 30 天；
- Cookie 使用 `HttpOnly`、`SameSite=Lax`，生产环境启用 `Secure`；
- Proxy 负责未登录时快速跳转，后台 layout 会查询数据库再次验证；
- 每个写入 Server Action 都单独执行管理员授权，不能只依赖页面保护；
- 登录后的 `referer` 仅接受站内 `/admin` 路径，避免开放重定向；
- 退出时同时删除数据库会话和浏览器会话 Cookie。

### 首次安装

SQLite migration 在数据库连接建立时执行幂等检查，因此前台页面和布局并行渲染时不会因为缺表产生 500。安装状态由独立的 `installation_state` 记录决定，而不是依赖 Cookie 或猜测用户表状态。

- 未安装时，前台、登录和后台统一引导至 `/install`；
- migration 通过 `_migrations` 表和 `BEGIN IMMEDIATE` 防止多实例重复执行；
- 管理员、默认设置、分类、欢迎文章与安装标记在同一事务内写入；
- 并发安装由事务写锁、安装标记主键和用户唯一索引共同阻止；
- 安装成功后使用现有数据库会话机制自动登录，不在 URL 中携带明文密码。

### Markdown 安全

数据库只保存 Markdown 源文。编辑器预览和文章详情共用一个渲染组件：

- `remark-gfm` 支持表格、任务列表等常用语法；
- 不启用原始 HTML 解析；
- `rehype-sanitize` 对渲染结果再次执行白名单过滤。

### 外观与主题

后台“外观”完整保留原版的主题列表、当前主题高亮、启用、设置和文件编辑体验，并为 Next.js 增加管理员会话级预览：

- 内置 `default` 和 `classic-22` 两套官方风格，切换后会改变前台布局、导航、文章排版和配色；
- Default 支持 LOGO 地址及五个侧栏模块开关，Classic 22 支持 LOGO 与自动、浅色、深色、自定义配色；
- 预览状态保存在 HttpOnly Cookie 中，仅当前已登录管理员可见，不影响游客；
- 当前主题和每个主题配置保存在 SQLite，切换主题使用写事务并触发全站重新验证；
- React/TypeScript 内置模板是构建产物，只提供只读源码浏览；在线编辑仅开放数据库中的 `custom.css`，避免把后台变成服务端代码执行入口；
- 所有启用、预览、配置和编辑 Server Action 都重新验证管理员权限及 Zod 输入。

### 个人设置

个人资料、撰写偏好和密码修改分别保存，保持 Typecho 原版页面与操作语义：

- 昵称留空时回退为用户名，个人主页可留空，邮箱必须合法且不能与其他账号冲突；
- Markdown、XMLRPC Markdown、自动保存及文章默认评论、引用、聚合权限按用户保存在 SQLite；
- 新建文章的高级选项会读取当前管理员的默认权限，不接受表单传入其他用户 ID；
- 密码使用与登录一致的 scrypt 哈希，个人设置中的新密码至少 6 位，更新后保持当前会话有效；
- 每个 Server Action 都根据当前数据库会话重新确定用户并执行 Zod 校验。

### 图片存储

开发环境将图片写入 `public/uploads`。业务层只依赖 `ImageStorage` 接口，后续可以替换为 S3、Cloudflare R2 或其他对象存储。生产环境不建议依赖 Serverless 实例的本地磁盘。

## 当前安全限制

当前版本已经保护 `/admin` 和后台写入操作，但仍没有登录速率限制、完整审计日志、上传内容嗅探和多因素认证。生产部署还应使用 HTTPS、强随机管理员密码、反向代理限流与独立备份。

## 分阶段计划

### Phase 1：项目和数据库骨架

- [x] Next.js、TypeScript、Tailwind 和 pnpm
- [x] Drizzle Schema、migration 和 seed 结构
- [x] 前后台路由分层
- [x] repository、Server Action 和 Zod 分层

### Phase 2：内容 CRUD

- [x] 文章创建、编辑、删除
- [x] 草稿与发布状态
- [x] 分类和标签
- [ ] 表单字段级错误反馈
- [ ] 删除确认和操作成功提示

### Phase 3：Markdown 与上传

- [x] Markdown 实时预览和安全渲染
- [x] 本地图片上传抽象
- [ ] 图片库、替换和删除
- [ ] 上传文件内容嗅探与限流

### Phase 4：前台主题

- [x] 首页和详情页
- [x] 分类、标签、分页和 404
- [x] Typecho 默认主题风格的响应式前台
- [x] Default 与 Classic 22 动态外观切换、预览、设置和安全 CSS 编辑
- [x] Typecho 原版风格的管理后台
- [ ] 动态 SEO metadata、站点地图和 RSS

### Phase 5：测试与加固

- [x] 管理员登录和会话
- [x] Server Action 权限校验
- [ ] 单元测试和端到端测试
- [ ] PostgreSQL 与对象存储部署方案
