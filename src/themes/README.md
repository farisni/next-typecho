# Next Typecho 主题

每套内置主题位于独立目录中，并由四部分组成：

- `definition.ts`：主题元数据、默认配置、Zod 校验规则和后台设置字段。
- `layout.tsx`：主题的页面骨架。
- 主题自己的页头、页脚及其它组件。
- `public/themes/<slug>/screenshot.*`：后台外观列表使用的预览图。

新增主题时：

1. 在 `src/themes/<slug>` 创建主题定义与布局。
2. 将定义加入 `src/lib/themes/registry.ts`。
3. 将布局加入 `src/themes/renderers.tsx`。
4. 添加以 `.theme-<slug>` 为根作用域的样式和主题截图。

前台路由只提供文章、分类和页面数据；当前主题负责整体布局。主题启用状态、
预览 Cookie、配置 JSON 和 `custom.css` 均由现有主题服务统一处理。
