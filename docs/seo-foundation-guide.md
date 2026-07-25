# SEO 基础落地指南（Next Typecho）

更新时间：2026-07-26

本文用于沉淀当前项目的 SEO 基础实施方案，按“执行版”编排。

## 1. 目标

在不大改当前主题体系的前提下，先把最关键搜索可见性做对：

- 站点和文章页能够被稳定抓取
- 内容展示与真实 URL 一致
- 关键元信息完整（OG/Twitter/canonical）
- 列表页和文章页有规范站点地图与 robots 策略
- 页面结构与速度对搜索友好

## 2. 全局基础（`src/app/layout.tsx`）

1) 增加/补齐 `metadata`：

- `title`：`Dust In The Wind |` + 页面标题后缀
- `description`
- `keywords`（适量）
- `metadataBase` 指向生产域名
- `openGraph`、`twitter`
- `robots`（index/follow 与 max-image-preview 等）

示例思路：

- `title: { default, template: "%s | Dust In The Wind" }`
- `openGraph: { siteName, type: website, locale: "zh_CN" }`
- `twitter: { card: "summary_large_image" }`

2) 加上站点级 favicon/icon（如果没有统一补齐）

- site icon、favicon、apple icon

3) 生产环境元数据基础 URL 设置

- `.env` 读取 `APP_BASE_URL`，`metadataBase: new URL(process.env.APP_BASE_URL ?? "https://farisni.com")`

## 3. 文章页动态元信息（`src/app/(site)/posts/[slug]/page.tsx`）

文章是最核心页面，建议新增 `generateMetadata`：

- `title`：文章标题
- `description`：文章摘要（长度 120~180 字）
- `alternates.canonical`：`/posts/{slug}` 的规范链接
- Open Graph `type: article`
  - `publishedTime`
  - `modifiedTime`
  - `authors`
  - `tags`
  - 封面图（有）
- Twitter 卡片同上

> 这部分是 SEO 最需要先做的；无论主题如何变化，动态元信息都能单独收益。

### 3.1 结构化数据（JSON-LD）

在文章页添加 `application/ld+json`：

- `@type: Article`
- `headline`、`description`
- `author`（至少 name）
- `datePublished`、`dateModified`
- `image`
- `mainEntityOfPage`

可放在服务端组件内渲染 `<script type="application/ld+json">...</script>`。

## 4. 分类页 / 标签页 / 列表页元信息

至少给这些页面加静态 `metadata`（可直接写死文案）：

- `/posts`（文章列表）
- `/categories`（分类归档）
- `/categories/[slug]`（单分类）
- `/tags`（标签归档）
- `/tags/[slug]`（单标签）

建议字段：

- 标题：`分类文章 - Site Name`
- 描述：说明该页面内容范围和更新频率
- canonical：规范 URL
- robots：公开列表保留 index/follow

## 5. robots 与 sitemap

新建以下文件（Next App Router 约定）：

- `src/app/robots.ts`
- `src/app/sitemap.ts`

### 5.1 robots

允许抓取：

- `/`

禁止抓取：

- `/admin`
- `/login`
- `/api`
- `/install`

可附带：

- `sitemap: /sitemap.xml`

### 5.2 sitemap

包含：

- 首页
- 文章列表页/分页页
- 每篇文章 URL（`slug`）
- 分类/标签页

每项建议配置：

- `lastModified`
- `changeFrequency`
- `priority`

## 6. 内容结构（对 SEO 很关键）

1) 标题层级

- 每篇文章页面只有一个主 `h1`
- 段落标题按 `h2/h3` 递增，不乱跳级

2) 内容可读性

- 摘要段在正文首位
- 段落长度适中，避免长段导致跳出率上升

3) 内链策略

- 相关文章、分类、标签卡片使用自然锚文本（不是“点击这里”）
- 侧边栏目只保留高价值、长期相关词的链接

4) 语义增强

- `article` 语义区块可用 `itemScope`/`itemType`（可选）
- 继续保留面包屑（`Breadcrumbs`）便于理解导航结构

## 7. 图片、URL 与 canonical 规范

1) URL

- 文章 URL 使用固定英文 slug，尽量短
- 避免无意义查询参数生成独立内容 URL

2) canonical

- 同一篇文章、同一分类列表避免多个入口
- 多参数页优先保留列表页主路径

3) 图片

- 每张图片有 `alt`
- 封面图建议提供 `og:image`（1200x630）

## 8. 速度与抓取友好性（下一层优化）

SEO 并不是只改 meta，速度也影响排名与爬虫抓取效率。

建议：

- 公开页尽量可缓存（配合现有 ISR/缓存策略）
- 首屏 CSS/JS 收敛，压缩与缓存资源头
- 避免列表/详情每次全量重算，减轻数据库与渲染压力

## 9. 验证流程（每步执行）

### 9.1 页面级检查

```bash
curl -I https://farisni.com/
curl -I https://farisni.com/posts/your-slug
curl -I https://farisni.com/sitemap.xml
curl -I https://farisni.com/robots.txt
```

检查点：

- 有 `rel="canonical"`
- 响应中有 OG/Twitter tag
- 返回 200，不重定向到后台

### 9.2 外部工具

- Google Search Console（URL 检查 + 索引状态）
- Bing Webmaster 工具
- [Rich Results Test](https://search.google.com/test/rich-results)
- `Lighthouse`（移动端可读性与性能）

## 10. 部署清单（建议放到发布前 checklist）

- 元数据是否在 `APP_ENV=production` 下可正常读到生产域名
- `robots.ts` / `sitemap.ts` 有文件且可访问
- 文章详情 `generateMetadata` 能读到标题、摘要、封面、发布时间
- 文章详情 JSON-LD 在有图片/摘要时能正常序列化
- 站点升级后 sitemap 能重新生成最新文章链接

---

## 11. 当前待办（可直接作为开发任务）

1. 实现全局 `metadata` + 站点 favicon
2. 为文章详情加 `generateMetadata`
3. 增加 `robots.ts`
4. 增加 `sitemap.ts`
5. 在文章详情加入 JSON-LD
6. 补齐 `h1` 与标题层级检查
7. 全部验收点通过后再看是否接“每篇文章 OG 封面规范化”
