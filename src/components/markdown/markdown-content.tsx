import { renderMarkdownToHtml } from "@/lib/markdown/render-post-html";

type MarkdownContentProps = {
  content: string;
};

export async function MarkdownContent({ content }: MarkdownContentProps) {
  const html = await renderMarkdownToHtml(content);

  return (
    <div
      className="markdown-body post-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
