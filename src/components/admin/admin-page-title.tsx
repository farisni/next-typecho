import Link from "next/link";

type AdminPageTitleProps = {
  title: string;
  addHref?: string;
  addLabel?: string;
};

export function AdminPageTitle({ title, addHref, addLabel = "新增" }: AdminPageTitleProps) {
  return (
    <div className="typecho-page-title">
      <h2>{title}</h2>
      {addHref && <Link href={addHref}>{addLabel}</Link>}
    </div>
  );
}
