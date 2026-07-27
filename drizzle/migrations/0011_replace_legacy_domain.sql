-- 统一历史文章内容中的旧域名，避免已发布文章继续引用 farisni.top。
UPDATE posts
SET
  excerpt = replace(excerpt, 'farisni.top', 'farisni.com'),
  content = replace(content, 'farisni.top', 'farisni.com'),
  rendered_content = replace(rendered_content, 'farisni.top', 'farisni.com');
