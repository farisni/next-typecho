import { PostAdvancedOptions } from "@/components/admin/post-advanced-options";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import type { WritingPreferences } from "@/lib/repositories/profile";

type Taxonomy = { id: string; name: string };
type PostFormValue = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  categoryId: string | null;
  tags: Taxonomy[];
};

type PostFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: Taxonomy[];
  tags: Taxonomy[];
  value?: PostFormValue;
  preferences?: WritingPreferences;
};

export function PostForm({ action, categories, tags, value, preferences }: PostFormProps) {
  const selectedTags = new Set(value?.tags.map((tag) => tag.id));

  return (
    <form action={action} className="typecho-post-area">
      <div className="post-form-main">
        {value?.status === "draft" && <cite className="edit-draft-notice">当前正在编辑的是未发布的草稿</cite>}
        <p className="title"><label className="sr-only" htmlFor="title">标题</label><input id="title" className="title-input" name="title" defaultValue={value?.title} placeholder="标题" autoComplete="off" required /></p>
        <p className="url-slug"><span>http://localhost:3000/posts/</span><label className="sr-only" htmlFor="slug">网址缩略名</label><input id="slug" className="mono slug-input" name="slug" defaultValue={value?.slug} placeholder="hello-next-typecho" required /></p>
        <MarkdownEditor defaultValue={value?.content} />
        <details className="excerpt-panel">
          <summary>文章摘要</summary>
          <label className="sr-only" htmlFor="excerpt">摘要</label>
          <textarea id="excerpt" name="excerpt" defaultValue={value?.excerpt ?? ""} placeholder="可选；留空时前台将截取正文" />
        </details>
        <p className="post-submit">
          <span></span>
          <span className="right">
            <button type="submit" name="status" value="draft" className="btn">保存草稿</button>
            <button type="submit" name="status" value="published" className="btn primary">发布文章</button>
          </span>
        </p>
      </div>
      <aside id="edit-secondary">
        <ul className="typecho-option-tabs post-option-tabs"><li className="active"><span>选项</span></li><li><span>附件</span></li></ul>
        <section className="typecho-post-option category-option">
          <label className="typecho-label">分类</label>
          <ul>
            <li><input id="category-none" type="radio" name="categoryId" value="" defaultChecked={!value?.categoryId} /><label htmlFor="category-none">未分类</label></li>
            {categories.map((category) => <li key={category.id}><input id={`category-${category.id}`} type="radio" name="categoryId" value={category.id} defaultChecked={value?.categoryId === category.id} /><label htmlFor={`category-${category.id}`}>{category.name}</label></li>)}
          </ul>
        </section>
        <section className="typecho-post-option">
          <label className="typecho-label">标签</label>
          <div className="post-tag-options">
            {tags.map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={selectedTags.has(tag.id)} />{tag.name}</label>)}
            {tags.length === 0 && <span className="description-text">暂无标签</span>}
          </div>
        </section>
        <PostAdvancedOptions preferences={preferences} status={value?.status} />
      </aside>
    </form>
  );
}
