import { AdminCommentList } from "@/components/admin/admin-comment-list";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import {
  listCommentsForAdmin,
  type CommentStatus,
} from "@/lib/repositories/comments";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    keywords?: string;
    page?: string;
    notice?: string;
  }>;
}) {
  const params = await searchParams;
  const status = ["approved", "waiting", "spam", "all"].includes(params.status ?? "")
    ? params.status as CommentStatus | "all"
    : "approved";
  const page = /^\d+$/.test(params.page ?? "") ? Number(params.page) : 1;
  const result = listCommentsForAdmin({
    status,
    keywords: params.keywords,
    page,
  });

  return (
    <>
      <AdminPageTitle title="管理评论" />
      <AdminCommentList
        {...result}
        status={status}
        keywords={params.keywords ?? ""}
        notice={params.notice}
      />
    </>
  );
}
