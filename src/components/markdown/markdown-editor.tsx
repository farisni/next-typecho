"use client";

import { useRef, useState } from "react";
import type { ComponentProps, PointerEvent as ReactPointerEvent } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { Maximize2, Minimize2, Redo2, Undo2 } from "lucide-react";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { markdownCodeText } from "@/components/markdown/code-text";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";
import { remarkHighlight } from "@/components/markdown/remark-highlight";

type MarkdownEditorProps = {
  defaultValue?: string;
};

type MarkdownCodeProps = ComponentProps<"code"> & {
  node?: unknown;
};

function MarkdownPreviewCode({ className, children, node, ...props }: MarkdownCodeProps) {
  const language = /language-([\w-]+)/.exec(className ?? "")?.[1];
  if (language === "mermaid") {
    return <MermaidDiagram chart={markdownCodeText(node, children)} />;
  }

  return <code className={className} {...props}>{children}</code>;
}

const typechoEditorCommands = [
  { ...commands.bold, icon: <span className="typecho-markdown-icon typecho-markdown-icon-bold" /> },
  { ...commands.italic, icon: <span className="typecho-markdown-icon typecho-markdown-icon-italic" /> },
  commands.divider,
  { ...commands.link, icon: <span className="typecho-markdown-icon typecho-markdown-icon-link" /> },
  { ...commands.quote, icon: <span className="typecho-markdown-icon typecho-markdown-icon-quote" /> },
  { ...commands.code, icon: <span className="typecho-markdown-icon typecho-markdown-icon-code" /> },
  { ...commands.image, icon: <span className="typecho-markdown-icon typecho-markdown-icon-image" /> },
  commands.divider,
  { ...commands.orderedListCommand, icon: <span className="typecho-markdown-icon typecho-markdown-icon-ordered-list" /> },
  { ...commands.unorderedListCommand, icon: <span className="typecho-markdown-icon typecho-markdown-icon-unordered-list" /> },
  { ...commands.title, icon: <span className="typecho-markdown-icon typecho-markdown-icon-heading" /> },
  { ...commands.hr, icon: <span className="typecho-markdown-icon typecho-markdown-icon-thematic-break" /> },
];

export function MarkdownEditor({ defaultValue = "" }: MarkdownEditorProps) {
  const [content, setContent] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(452);
  const editorHeightRef = useRef(editorHeight);
  const contentHistoryRef = useRef([defaultValue]);
  const contentHistoryIndexRef = useRef(0);

  function focusEditor() {
    requestAnimationFrame(() => document.getElementById("markdown-editor-source")?.focus());
  }

  function changeContent(nextContent: string) {
    const currentContent = contentHistoryRef.current[contentHistoryIndexRef.current];
    if (nextContent === currentContent) return;

    contentHistoryRef.current = contentHistoryRef.current.slice(0, contentHistoryIndexRef.current + 1);
    contentHistoryRef.current.push(nextContent);
    contentHistoryIndexRef.current += 1;
    setContent(nextContent);
  }

  function undoContent() {
    if (contentHistoryIndexRef.current === 0) return;

    contentHistoryIndexRef.current -= 1;
    setContent(contentHistoryRef.current[contentHistoryIndexRef.current]);
    focusEditor();
  }

  function redoContent() {
    if (contentHistoryIndexRef.current >= contentHistoryRef.current.length - 1) return;

    contentHistoryIndexRef.current += 1;
    setContent(contentHistoryRef.current[contentHistoryIndexRef.current]);
    focusEditor();
  }

  function submitPost(status: "draft" | "published") {
    const form = document.querySelector<HTMLFormElement>("form.typecho-post-area");
    const submitButton = form?.querySelector<HTMLButtonElement>(
      `button[name="status"][value="${status}"]`,
    );
    if (form && submitButton) form.requestSubmit(submitButton);
  }

  function previewPost() {
    const slugInput = document.getElementById("slug") as HTMLInputElement | null;
    const slug = slugInput?.value.trim();
    if (!slug) {
      slugInput?.focus();
      return;
    }

    window.open(`/posts/${encodeURIComponent(slug)}`, "_blank", "noopener,noreferrer");
  }

  const typechoActionCommands = [
    commands.divider,
    {
      name: "undo",
      keyCommand: "undo",
      shortcuts: "ctrlcmd+z",
      buttonProps: { "aria-label": "撤销" },
      icon: <Undo2 className="typecho-toolbar-lucide" aria-hidden="true" />,
      execute: undoContent,
    },
    {
      name: "redo",
      keyCommand: "redo",
      shortcuts: "ctrlcmd+shift+z",
      buttonProps: { "aria-label": "重做" },
      icon: <Redo2 className="typecho-toolbar-lucide" aria-hidden="true" />,
      execute: redoContent,
    },
    commands.divider,
    {
      ...commands.fullscreen,
      buttonProps: { "aria-label": "切换全屏" },
      icon: isFullscreen
        ? <Minimize2 className="typecho-toolbar-lucide" aria-hidden="true" />
        : <Maximize2 className="typecho-toolbar-lucide" aria-hidden="true" />,
      execute: (...args: Parameters<NonNullable<typeof commands.fullscreen.execute>>) => {
        setIsFullscreen((current) => !current);
        commands.fullscreen.execute?.(...args);
      },
    },
  ];

  const fullscreenActionsCommand = {
    name: "fullscreen-actions",
    keyCommand: "fullscreen-actions",
    render: () => (
      <div className="fullscreen-toolbar-actions">
        <span className="fullscreen-toolbar-cloud" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 18a4 4 0 0 1-.7-7.94A6 6 0 0 1 17.7 8.2 5 5 0 0 1 18 18h-3" />
            <path d="m9 15 3-3 3 3M12 12v8" />
          </svg>
        </span>
        <button type="button" className="btn fullscreen-toolbar-button" onClick={previewPost}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 5h5v5M19 5l-8 8" />
            <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
          </svg>
          预览文章
        </button>
        <button type="button" className="btn fullscreen-toolbar-button" onClick={() => submitPost("draft")}>
          保存草稿
        </button>
        <button type="button" className="btn primary fullscreen-toolbar-button" onClick={() => submitPost("published")}>
          发布文章
        </button>
      </div>
    ),
  };

  function resizeEditor(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();

    const startY = event.clientY;
    const startHeight = editorHeightRef.current;

    function handlePointerMove(pointerEvent: PointerEvent) {
      const nextHeight = Math.max(452, startHeight + pointerEvent.clientY - startY);
      editorHeightRef.current = nextHeight;
      setEditorHeight(nextHeight);
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div className="editor">
      <div className="wmd-button-bar">
        <div className="wmd-edittab">
          <button type="button" className={mode === "write" ? "active" : undefined} onClick={() => setMode("write")}>撰写</button>
          <button type="button" className={mode === "preview" ? "active" : undefined} onClick={() => setMode("preview")}>预览</button>
        </div>
      </div>
      <input type="hidden" name="content" value={content} />
      <div className="typecho-uiw-editor" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(value) => changeContent(value ?? "")}
          preview={isFullscreen ? "live" : mode === "write" ? "edit" : "preview"}
          enableScroll={isFullscreen}
          height={editorHeight}
          visibleDragbar={false}
          commands={[...typechoEditorCommands, ...typechoActionCommands]}
          extraCommands={isFullscreen ? [fullscreenActionsCommand] : []}
          previewOptions={{
            remarkPlugins: [remarkMath, remarkHighlight],
            rehypePlugins: [rehypeKatex],
            components: { code: MarkdownPreviewCode },
          }}
          textareaProps={{ id: "markdown-editor-source", "aria-label": "Markdown 内容" }}
        />
        <div
          className="typecho-editor-resize"
          role="separator"
          aria-label="调整编辑器高度"
          aria-orientation="horizontal"
          onPointerDown={resizeEditor}
        >
          <i />
        </div>
      </div>
    </div>
  );
}
