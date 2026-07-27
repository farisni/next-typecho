import { getTagDirectory } from "@/lib/repositories/taxonomies";
import { TagsPage } from "@/themes/lite/tags-page";

export const dynamic = "force-dynamic";

export default async function TagsDirectoryPage() {
  const directory = await getTagDirectory();
  return <TagsPage {...directory} />;
}
