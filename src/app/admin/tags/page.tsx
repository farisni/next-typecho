import { createTag } from "@/actions/taxonomies";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { AdminTagList } from "@/components/admin/admin-taxonomy-lists";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const { tags } = await listTaxonomies();
  return (
    <>
      <AdminPageTitle title="管理标签" />
      <div className="admin-meta-grid">
        <div>
          <AdminTagList tags={tags} />
        </div>
        <section className="typecho-mini-panel meta-side-form">
          <h3>新增标签</h3>
          <form action={createTag} className="meta-create-form">
            <label><span className="typecho-label">标签名称</span><input name="name" required /></label>
            <label><span className="typecho-label">标签缩略名</span><input name="slug" placeholder="tag-slug" required /></label>
            <button className="btn primary" type="submit">增加标签</button>
          </form>
        </section>
      </div>
    </>
  );
}
