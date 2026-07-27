import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
};

export function Pagination({ page, totalPages, query = {} }: PaginationProps) {
  if (totalPages <= 1) return null;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const hrefForPage = (pageNumber: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(pageNumber));
    return `?${params.toString()}`;
  };

  return (
    <ol className="page-navigator" aria-label="分页">
      <li className={hasPrevious ? undefined : "is-disabled"}>
        {hasPrevious ? <Link href={hrefForPage(page - 1)}>« 前一页</Link> : <span aria-hidden="true">« 前一页</span>}
      </li>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <li key={number} className={number === page ? "current" : undefined}>
          <Link href={hrefForPage(number)} aria-current={number === page ? "page" : undefined}>{number}</Link>
        </li>
      ))}
      <li className={hasNext ? undefined : "is-disabled"}>
        {hasNext ? <Link href={hrefForPage(page + 1)}>后一页 »</Link> : <span aria-hidden="true">后一页 »</span>}
      </li>
    </ol>
  );
}
