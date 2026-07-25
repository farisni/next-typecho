export function BlogHeader({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <section className="handsome-blog-header">
      <div>
        <h1>{name}</h1>
        <p className="handsome-blog-description">最新文章</p>
        <span className="lite-blog-description">{description}</span>
      </div>
    </section>
  );
}
