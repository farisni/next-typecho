# Next Typecho SEO 落地现状与差距（2026-07-26）

> 目标：给这版网站做一次“是否 SEO 友好”的快速体检与落地清单。

## 一、当前状态判断

结论：**当前状态是“半合格（Partial）”**。可抓取性与基础可读性已有，但距离“搜索引擎友好”还有明显短板。

### 已有基础（有帮助）

- 有 `metadata` 基础字段（title/description）
- 路由采用语义化 slug（如 `/posts/[slug]`）
- 文章详情页面有 `h1`、`time`、`article` 结构
- 首页/列表页有分类、标签、RSS 链接入口

### 明显短板（非 SEO 友好）

1. 公开页面普遍使用 `force-dynamic`
   - 使页面更多走动态渲染，降低 CDN 缓存与静态抓取效率。

2. `metadata` 不完整
   - 缺失 `metadataBase`、标准化 `openGraph`、`twitter`、`alternates.canonical` 等。

3. 文章页未做按文动态元信息
   - 没有 `generateMetadata`，每篇文章不能自动输出独立 SEO 关键信息。

4. 缺少搜索协议文件接入
   - 缺失 `robots.ts` / `sitemap.ts`（或未按生产链路接入）。

5. 缺 JSON-LD 结构化数据
   - 没有 `Article`/`BlogPosting`/`BreadcrumbList`，错失搜索增强展示机会。

6. 图片/预览与社交未体系化
   - 缺少统一 `og:image` 与 `twitter:image` 规范化策略。

7. 公网静态资源与内容路径
   - 需要确认 `canonical`、分页页、分类/标签页 URL 的统一化。

---

## 二、最小可交付方案（第一优先）

### 1. 全站元信息统一

- 在 `src/app/layout.tsx` 增加完整站点级 metadata：
  - `metadataBase`
  - `title`（default/template）
  - `description`
  - `openGraph`
  - `twitter`
  - `robots`

### 2. 文章页动态 SEO

- 在 `src/app/(site)/posts/[slug]/page.tsx` 增加 `generateMetadata`
  - title / description（摘要）
  - alternates canonical
  - openGraph(type: article, published/modified time, tags, authors, images)
  - twitter card

### 3. robots 与 sitemap

- 新建 `src/app/robots.ts`
  - 允许：`/`
  - 禁止：`/admin`, `/login`, `/api`, `/install`
  - 输出站点 sitemap

- 新建 `src/app/sitemap.ts`
  - 包含：首页、分页列表、文章、分类、标签
  - 设置 `lastModified/changeFrequency/priority`

### 4. 结构化数据

- 在文章页注入 JSON-LD（`application/ld+json`）：
  - `@type: Article`
  - headline, description, author, datePublished, dateModified, image, mainEntityOfPage
  - `@type: BreadcrumbList` 可在详情页补充

### 5. 文章发布策略优化

- 发布后触发相关路径 revalidate（文章详情、首页、分类、标签）
- 减少无效动态渲染，提高抓取一致性

---

## 三、建议评分与验收

- 基线评分：6/10
  - 可见抓取：7/10
  - 元数据完整性：4/10
  - 社交卡片：4/10
  - 结构化数据：2/10
  - 站点发现（sitemap/robots）：2/10

### 验收清单

- [ ] `https://域名/sitemap.xml` 正常返回 XML
- [ ] `https://域名/robots.txt` 正常返回并包含 sitemap
- [ ] 文章页源代码含 `og:*`、`twitter:*`
- [ ] 文章页含 `application/ld+json`
- [ ] 详情页 URL 为规范 `https://.../posts/slug`
- [ ] 列表页分页在同一 canonical 规则下
- [ ] Lighthouse 移动/桌面 SEO 分项通过

---

## 四、落地顺序（推荐）

1. 先做 metadata + robots/sitemap（影响大，改动小）
2. 再做文章页 generateMetadata
3. 再加 JSON-LD
4. 再做动态页转静态缓存（按业务承受能力做 ISR / 缓存）

---

## 五、备注（当前可快速执行文件）

- `src/app/layout.tsx`
- `src/app/(site)/posts/[slug]/page.tsx`
- `src/app/(site)/posts/page.tsx`
- `src/app/(site)/categories/[slug]/page.tsx`
- `src/app/(site)/tags/[slug]/page.tsx`
- `src/app/robots.ts`（新增）
- `src/app/sitemap.ts`（新增）

---

更新时间：2026-07-26

