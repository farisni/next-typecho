import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
};

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <ol className="page-navigator" aria-label="分页">
      {page > 1 && <li><Link href={`?page=${page - 1}`}>« 前一页</Link></li>}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <li key={number} className={number === page ? "current" : undefined}>
          <Link href={`?page=${number}`} aria-current={number === page ? "page" : undefined}>{number}</Link>
        </li>
      ))}
      {page < totalPages && <li><Link href={`?page=${page + 1}`}>后一页 »</Link></li>}
    </ol>
  );
}
