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
    </>
  );
}
