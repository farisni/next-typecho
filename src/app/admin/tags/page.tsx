import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { AdminTagList } from "@/components/admin/admin-taxonomy-lists";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const { tags } = await listTaxonomies();
  return (
    <>
      <AdminPageTitle title="管理标签" />
      <AdminTagList tags={tags} />
    </>
  );
}
