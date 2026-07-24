"use client";

import { useEffect, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
        });

        const id = `mermaid-${crypto.randomUUID()}`;
        const rendered = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(rendered.svg);
          setError("");
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg("");
          setError(renderError instanceof Error ? renderError.message : "Mermaid 图表解析失败");
        }
      }
    }

    setSvg("");
    setError("");
    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-error">
        <strong>Mermaid 图表解析失败</strong>
        <pre><code>{chart}</code></pre>
      </div>
    );
  }

  if (!svg) return <div className="mermaid-loading">正在渲染 Mermaid 图表...</div>;

  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}
