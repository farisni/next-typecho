import { createPost } from "@/actions/posts";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { PostForm } from "@/components/admin/post-form";
import { requireAdministrator } from "@/lib/auth/session";
import { getWritingPreferences } from "@/lib/repositories/profile";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export default async function NewPostPage() {
  const user = await requireAdministrator("/admin/posts/new");
  const [{ categories, tags }, preferences] = await Promise.all([
    listTaxonomies(),
    getWritingPreferences(user.id),
  ]);
  return <><AdminPageTitle title="撰写新文章" /><PostForm action={createPost} categories={categories} tags={tags} preferences={preferences} /></>;
}
