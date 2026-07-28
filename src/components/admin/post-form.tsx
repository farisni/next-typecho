import { Save, Send } from "lucide-react";
import { PostAdvancedOptions } from "@/components/admin/post-advanced-options";
import { PostSidebar } from "@/components/admin/post-sidebar";
import { PostTagSelector } from "@/components/admin/post-tag-selector";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import type { WritingPreferences } from "@/lib/repositories/profile";

type Taxonomy = { id: string; name: string };
type PostFormValue = {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  content: string;
  status: string;
  allowComment: boolean;
  categoryId: string | null;
  tags: Taxonomy[];
  publishedAt: Date | null;
  updatedAt: Date;
};

type PostFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: Taxonomy[];
  tags: Taxonomy[];
  value?: PostFormValue;
  preferences?: WritingPreferences;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatDateTimeLocal(value: Date) {
  const parts = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function PostForm({ action, categories, tags, value, preferences }: PostFormProps) {
  const publishedAt = value?.publishedAt ?? new Date();

  return (
    <form action={action} className="typecho-post-area">
      <div className="post-form-main">
        {value?.status === "draft" && <cite className="edit-draft-notice">当前正在编辑的是未发布的草稿</cite>}
        <p className="title"><label className="sr-only" htmlFor="title">标题</label><input id="title" className="title-input" name="title" defaultValue={value?.title} placeholder="标题" autoComplete="off" required /></p>
        <p className="url-slug"><span>http://localhost:3000/posts/</span><label className="sr-only" htmlFor="slug">网址缩略名</label><input id="slug" className="mono slug-input" name="slug" defaultValue={value?.slug} placeholder="留空将根据标题自动生成" /></p>
        <MarkdownEditor defaultValue={value?.content} />
        <p className="post-submit">
          <span></span>
          <span className="right">
            <button type="submit" name="status" value="draft" className="btn admin-action-button">
              <Save aria-hidden="true" />
              保存草稿
            </button>
            <button type="submit" name="status" value="published" className="btn primary admin-action-button">
              <Send aria-hidden="true" />
              发布文章
            </button>
          </span>
        </p>
      </div>
      <aside id="edit-secondary">
        <PostSidebar defaultCoverImage={value?.coverImage}>
          <section className="typecho-post-option">
            <label htmlFor="publishedAt" className="typecho-label">发布日期</label>
            <p>
              <input
                id="publishedAt"
                name="publishedAt"
                className="typecho-date typecho-datetime w-100"
                type="datetime-local"
                step="60"
                defaultValue={formatDateTimeLocal(publishedAt)}
              />
            </p>
          </section>
          {value?.publishedAt && (
            <section className="typecho-post-option">
              <label htmlFor="updatedAt" className="typecho-label">修改日期</label>
              <p>
                <input
                  id="updatedAt"
                  className="typecho-date typecho-datetime w-100"
                  type="datetime-local"
                  value={formatDateTimeLocal(value.updatedAt)}
                  readOnly
                  aria-readonly="true"
                />
              </p>
            </section>
          )}
          <section className="typecho-post-option category-option">
            <label className="typecho-label">分类</label>
            <ul>
              {categories.length > 0 ? categories.map((category, index) => <li key={category.id}><input id={`category-${category.id}`} type="checkbox" name="categoryId" value={category.id} defaultChecked={value?.categoryId === category.id || (!value?.categoryId && index === 0)} /><label htmlFor={`category-${category.id}`}>{category.name}</label></li>) : <li><input id="category-none" type="checkbox" name="categoryId" value="" defaultChecked={!value?.categoryId} /><label htmlFor="category-none">默认分类</label></li>}
            </ul>
          </section>
          <section className="typecho-post-option post-tags-option">
            <label className="typecho-label">标签</label>
            <PostTagSelector tags={tags} defaultValue={value?.tags} />
          </section>
          <PostAdvancedOptions preferences={preferences} status={value?.status} allowComment={value?.allowComment} />
        </PostSidebar>
      </aside>
    </form>
  );
}
