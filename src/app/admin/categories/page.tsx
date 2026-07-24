import { createCategory } from "@/actions/taxonomies";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { AdminCategoryList } from "@/components/admin/admin-taxonomy-lists";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { categories } = await listTaxonomies();
  return (
    <>
      <AdminPageTitle title="管理分类" />
      <AdminCategoryList categories={categories} />
      <section className="typecho-mini-panel">
        <h3>新增分类</h3>
        <form action={createCategory} className="meta-create-form">
          <label><span className="typecho-label">分类名称</span><input name="name" required /></label>
          <label><span className="typecho-label">分类缩略名</span><input name="slug" placeholder="category-slug" required /></label>
          <button className="btn primary" type="submit">增加分类</button>
        </form>
      </section>
    </>
  );
}
