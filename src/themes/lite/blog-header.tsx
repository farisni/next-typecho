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
        <p className="handsome-blog-description">人生如逆旅，我亦是行人。</p>
        <span className="lite-blog-description">{description}</span>
      </div>
    </section>
  );
}
