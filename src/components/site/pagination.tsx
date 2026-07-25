import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
};

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <ol className="page-navigator" aria-label="分页">
      <li className={hasPrevious ? undefined : "page-spacer"}>
        {hasPrevious ? <Link href={`?page=${page - 1}`}>« 前一页</Link> : <span aria-hidden="true">« 前一页</span>}
      </li>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <li key={number} className={number === page ? "current" : undefined}>
          <Link href={`?page=${number}`} aria-current={number === page ? "page" : undefined}>{number}</Link>
        </li>
      ))}
      <li className={hasNext ? undefined : "page-spacer"}>
        {hasNext ? <Link href={`?page=${page + 1}`}>后一页 »</Link> : <span aria-hidden="true">后一页 »</span>}
      </li>
    </ol>
  );
}
