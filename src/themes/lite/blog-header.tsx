import Link from "next/link";

export function BlogHeader({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <section className="handsome-blog-header">
      <div className="lite-blog-heading">
        <div className="lite-blog-title-row">
          <h1>{name}</h1>
          <Link className="lite-blog-rss" href="/feed.xml" aria-label="RSS 订阅">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M5 19h.01M5 14a5 5 0 0 1 5 5M5 8a11 11 0 0 1 11 11" />
            </svg>
          </Link>
        </div>
        <p className="handsome-blog-description">人生如逆旅，我亦是行人。</p>
        <span className="lite-blog-description">{description}</span>
      </div>
    </section>
  );
}
