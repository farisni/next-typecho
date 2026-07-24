import { run, transaction } from "@/lib/db";

export type BulkPostOperation = "delete" | "published" | "waiting" | "hidden" | "private";

export function bulkManagePostRecords(postIds: string[], operation: BulkPostOperation) {
  const now = Date.now();
  transaction(() => {
    for (const postId of postIds) {
      if (operation === "delete") {
        run("DELETE FROM posts WHERE id = ?", postId);
      } else {
        run(
          `UPDATE posts SET status = ?,
             published_at = CASE WHEN ? = 'published' THEN coalesce(published_at, ?) ELSE published_at END,
             updated_at = ? WHERE id = ?`,
          operation,
          operation,
          now,
          now,
          postId,
        );
      }
    }
  });
}
