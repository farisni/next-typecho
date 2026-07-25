# 文章渲染保留 Astro 风格（后续执行版）

更新时间：2026-07-26

> 目标：先沉淀方案，不改现有体验。把“文章渲染链路”朝 Astro 的构建/预渲染思路靠近。

## 0. 结论先行

你当前项目的方向应是：

- 页面级：公开页尽可能走静态/短时缓存（`ISR`）
- 文档级：Markdown 在“写入瞬间”就转成 HTML，读取时复用
- 行为级：当内容变动时触发失效并可回源重建

这和 Astro 的核心思路一致：

- Astro 默认偏向静态输出，运行时减少动态计算；
- 仅在需要交互的地方做水合（hydrate）；
- 你这个项目可借鉴的就是“发布时预渲染 + 读时复用”。

---

## 1. 先保留的现状（你现在已有）

我已把下面基础链路保留在代码里，作为“第一阶段可读基线”：

1. [src/lib/markdown/render-post-html.ts](/Users/faris/Code/Personal/next-typecho/src/lib/markdown/render-post-html.ts)
   - 新增 `renderMarkdownToHtml()`，把 Markdown 转成可存储的 HTML 字符串。
2. [src/db/schema.ts](/Users/faris/Code/Personal/next-typecho/src/db/schema.ts)
   - `posts` 增加 `rendered_content` 与 `rendered_content_updated_at`。
3. [src/actions/posts.ts](/Users/faris/Code/Personal/next-typecho/src/actions/posts.ts)
   - `createPost` / `updatePost` 已在入库前同步产出 `rendered_content`。
4. [drizzle/migrations/0006_rendered_post_content.sql](/Users/faris/Code/Personal/next-typecho/drizzle/migrations/0006_rendered_post_content.sql)
   - 持久化字段变更。
5. [src/lib/repositories/posts.ts](/Users/faris/Code/Personal/next-typecho/src/lib/repositories/posts.ts)
   - 仓储返回 `renderedContent`。
6. [src/app/(site)/posts/[slug]/page.tsx](/Users/faris/Code/Personal/next-typecho/src/app/(site)/posts/[slug]/page.tsx)
   - 优先使用 `post.renderedContent` 渲染，回退到实时 Markdown。

> 说明：这版不是 Astro 完整静态站方案，但已经是“走得很像 Astro 的离线化渲染方向”。

---

## 2. 为什么这比“每次请求实时 Markdown 渲染”更近 Astro

Astro 的优势在于：

- 内容在构建期（或可控时机）预处理、预计算；
- 运行时主要做 HTML 传输，不重复做“内容编译”；
- 减少 TTFB 抖动和 CPU 峰值。

当前方案把 Markdown 编译从每次访问移到了“发布/更新时”，属于同一思路的可行实现：

- **发布/更新路径**承担编译成本；
- **阅读路径**只做读取、拼接、返回。

对你“读为主、写为辅”的站点，这非常符合性价比最优的演进顺序。 

---

## 3. Astro 风格完整化（下一步，不本次立刻实现）

### 3.1 阶段 A：内容持久化快照（已打底）

目标：把 `rendered_content` 做成“源码与渲染结果分离源”：

- `raw_content`（源） + `rendered_content`（产物）
- `rendered_content_updated_at` 标记一致性
- 任何内容更新都同步刷新

### 3.2 阶段 B：页面级缓存（ISR）

目标：详情页本身也不要每次重算页面。

- `/posts/[slug]`：`revalidate` + `revalidatePath` 失效链
- 首页/分类/标签页：先短 TTL（30~120s）

### 3.3 阶段 C：内容快照外置（可选）

当你后续想更接近 Astro 的“纯静态文件”体验：

- 将 `rendered_content` 存到对象存储/文件系统快照（例如 `dist/rendered/posts/{slug}.html`）
- 详情页优先读取快照文件
- 数据库仅保留元信息和回源路径

---

## 4. 推荐实现顺序（不改现有行为，逐步切）

1. 保持现有数据库字段与写入链路（当前状态）
2. 先加首页、分类、标签页 `revalidate`（最小改造）
3. 给发布/编辑动作增加完整失效：
   - 文章详情路径
   - 主页
   - 所属分类/标签列表路径
4. 增加“渲染时间戳比对”：
   - 若 `rendered_content_updated_at` 早于 `updated_at`，强制降级为实时渲染并重建
5. 后续再决定是否落 `rendered_content` 文件化缓存

---

## 5. 风险与注意

- **安全性**：`dangerouslySetInnerHTML` 仅在来源可信且经过清洗链路时使用。
- **一致性**：发布失败时要避免 `rendered_content` 与 `content` 不一致。
- **回滚**：任何新链路先加 fallback 到实时渲染，确认稳定后再开关。

---

## 6. 代码落地入口（后续执行）

建议把这个方向和你现有代码挂钩：

- `createPost` / `updatePost`：维护 `rendered_content` 与 `rendered_content_updated_at`
- `post` 仓储：返回 `renderedContent`
- 详情页：优先 html 快照渲染
- 路由层：加 `revalidate` 与 `revalidatePath` 链路

---

## 7. 先记住：当前不建议立刻全量翻动主题

为了减少回归，建议先把“内容渲染链路”作为独立后端优化，再配合主题布局逐步切分。

