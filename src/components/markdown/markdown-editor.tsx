"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";

type MarkdownEditorProps = {
  defaultValue?: string;
};

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
  const [editorHeight, setEditorHeight] = useState(452);
  const editorHeightRef = useRef(editorHeight);

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
          onChange={(value) => setContent(value ?? "")}
          preview={mode === "write" ? "edit" : "preview"}
          height={editorHeight}
          visibleDragbar={false}
          commands={typechoEditorCommands}
          extraCommands={[]}
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
