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
        <p className="handsome-blog-description">{description}</p>
      </div>
    </section>
  );
}
