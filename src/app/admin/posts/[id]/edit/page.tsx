import { updatePost } from "@/actions/posts";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { PostForm } from "@/components/admin/post-form";
import { getPostByIdForAdmin } from "@/lib/repositories/posts";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, { categories, tags }] = await Promise.all([getPostByIdForAdmin(id), listTaxonomies()]);
  const action = updatePost.bind(null, id);

  return <><AdminPageTitle title="编辑文章" /><PostForm action={action} categories={categories} tags={tags} value={post} /></>;
}
