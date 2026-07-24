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
        <section className="typecho-post-option">
          <label htmlFor="date" className="typecho-label">发布日期</label>
          <p><input id="date" name="date" className="typecho-date w-100" type="text" autoComplete="off" /></p>
        </section>
        <section className="typecho-post-option category-option">
          <label className="typecho-label">分类</label>
          <ul>
            {categories.length > 0 ? categories.map((category, index) => <li key={category.id}><input id={`category-${category.id}`} type="checkbox" name="categoryId" value={category.id} defaultChecked={value?.categoryId === category.id || (!value?.categoryId && index === 0)} /><label htmlFor={`category-${category.id}`}>{category.name}</label></li>) : <li><input id="category-none" type="checkbox" name="categoryId" value="" defaultChecked={!value?.categoryId} /><label htmlFor="category-none">默认分类</label></li>}
          </ul>
        </section>
        <section className="typecho-post-option">
          <label className="typecho-label">标签</label>
          <p><input id="tags" name="tags" type="text" className="w-100" defaultValue={value?.tags.map((tag) => tag.name).join(", ")} autoComplete="off" /></p>
          {tags.filter((tag) => selectedTags.has(tag.id)).map((tag) => <input key={tag.id} type="hidden" name="tagIds" value={tag.id} />)}
        </section>
        <PostAdvancedOptions preferences={preferences} status={value?.status} />
      </aside>
    </form>
  );
}
