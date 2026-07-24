"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ClipboardEvent as ReactClipboardEvent,
  ComponentProps,
  PointerEvent as ReactPointerEvent,
} from "react";
import { commands } from "@uiw/react-md-editor";
import { ExternalLink, Maximize2, Minimize2, Redo2, Save, Send, Undo2 } from "lucide-react";
import dynamic from "next/dynamic";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { uploadImage } from "@/actions/upload-image";
import { markdownCodeText } from "@/components/markdown/code-text";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";
import { remarkHighlight } from "@/components/markdown/remark-highlight";

type MarkdownEditorProps = {
  defaultValue?: string;
};

const MIN_EDITOR_HEIGHT = 480;
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((module) => module.default),
  {
    ssr: false,
    loading: () => <div className="typecho-editor-loading" />,
  },
);

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

export function MarkdownEditor({ defaultValue = "" }: MarkdownEditorProps) {
  const [content, setContent] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorHeight, setEditorHeight] = useState(MIN_EDITOR_HEIGHT);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("https://");
  const editorHeightRef = useRef(editorHeight);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const imageUrlInputRef = useRef<HTMLInputElement>(null);
  const imageSelectionRef = useRef({ start: 0, end: 0, alt: "" });
  const contentRef = useRef(content);
  const contentHistoryRef = useRef([defaultValue]);
  const contentHistoryIndexRef = useRef(0);
  contentRef.current = content;

  useEffect(() => {
    if (!isImageDialogOpen) return;

    imageUrlInputRef.current?.focus();
    imageUrlInputRef.current?.select();
  }, [isImageDialogOpen]);

  useEffect(() => {
    function handleInsertAttachment(event: Event) {
      const { name, url } = (event as CustomEvent<{ name: string; url: string }>).detail;
      const textarea = document.getElementById("markdown-editor-source") as HTMLTextAreaElement | null;
      const source = contentRef.current;
      const start = textarea?.selectionStart ?? source.length;
      const end = textarea?.selectionEnd ?? start;
      const selectedText = source.slice(start, end);
      const markdown = `![${selectedText || name}](${url})`;

      changeContent(`${source.slice(0, start)}${markdown}${source.slice(end)}`);
      requestAnimationFrame(() => {
        const editor = document.getElementById("markdown-editor-source") as HTMLTextAreaElement | null;
        const caretPosition = start + markdown.length;
        editor?.focus();
        editor?.setSelectionRange(caretPosition, caretPosition);
      });
    }

    function handleRemoveAttachment(event: Event) {
      const { url } = (event as CustomEvent<{ url: string }>).detail;
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const source = contentRef.current;
      const wholeLinePattern = new RegExp(
        `^[\\t ]*!\\[[^\\]]*\\]\\(${escapedUrl}\\)[\\t ]*(?:\\r?\\n|$)`,
        "gm",
      );
      const inlinePattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}\\)`, "g");
      const nextContent = source
        .replace(wholeLinePattern, "")
        .replace(inlinePattern, "");

      if (nextContent !== source) changeContent(nextContent);
    }

    window.addEventListener("typecho:insert-attachment", handleInsertAttachment);
    window.addEventListener("typecho:remove-attachment", handleRemoveAttachment);
    return () => {
      window.removeEventListener("typecho:insert-attachment", handleInsertAttachment);
      window.removeEventListener("typecho:remove-attachment", handleRemoveAttachment);
    };
  }, []);

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

  function openImageDialog() {
    const textarea = document.getElementById("markdown-editor-source") as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? start;

    imageSelectionRef.current = {
      start,
      end,
      alt: content.slice(start, end),
    };
    setImageUrl("https://");
    setIsImageDialogOpen(true);
  }

  function closeImageDialog() {
    setIsImageDialogOpen(false);
    focusEditor();
  }

  function insertImage() {
    const url = imageUrl.trim();
    if (!url || url === "https://") {
      imageUrlInputRef.current?.focus();
      return;
    }

    const { start, end, alt } = imageSelectionRef.current;
    const imageMarkdown = `![${alt}](${url})`;
    changeContent(`${content.slice(0, start)}${imageMarkdown}${content.slice(end)}`);
    setIsImageDialogOpen(false);

    requestAnimationFrame(() => {
      const textarea = document.getElementById("markdown-editor-source") as HTMLTextAreaElement | null;
      const caretPosition = start + imageMarkdown.length;
      textarea?.focus();
      textarea?.setSelectionRange(caretPosition, caretPosition);
    });
  }

  async function pasteClipboardImages(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (imageFiles.length === 0) return;

    event.preventDefault();
    const source = contentRef.current;
    const start = event.currentTarget.selectionStart;
    const end = event.currentTarget.selectionEnd;

    try {
      const uploadedImages = [];

      for (const [index, file] of imageFiles.entries()) {
        const formData = new FormData();
        formData.set("image", file);
        const storedImage = await uploadImage(formData);
        const name = file.name || `clipboard-image-${index + 1}`;

        uploadedImages.push({ ...storedImage, name });
        window.dispatchEvent(
          new CustomEvent("typecho:attachment-uploaded", {
            detail: {
              id: storedImage.key,
              name,
              size: storedImage.size,
              url: storedImage.url,
            },
          }),
        );
      }

      const markdown = uploadedImages
        .map((image) => `![${image.name}](${image.url})`)
        .join("\n") + "\n";
      changeContent(`${source.slice(0, start)}${markdown}${source.slice(end)}`);

      requestAnimationFrame(() => {
        const textarea = document.getElementById("markdown-editor-source") as HTMLTextAreaElement | null;
        const caretPosition = start + markdown.length;
        textarea?.focus();
        textarea?.setSelectionRange(caretPosition, caretPosition);
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "粘贴图片上传失败");
    }
  }

  const typechoEditorCommands = [
    { ...commands.bold, icon: <span className="typecho-markdown-icon typecho-markdown-icon-bold" /> },
    { ...commands.italic, icon: <span className="typecho-markdown-icon typecho-markdown-icon-italic" /> },
    commands.divider,
    { ...commands.link, icon: <span className="typecho-markdown-icon typecho-markdown-icon-link" /> },
    { ...commands.quote, icon: <span className="typecho-markdown-icon typecho-markdown-icon-quote" /> },
    { ...commands.code, icon: <span className="typecho-markdown-icon typecho-markdown-icon-code" /> },
    {
      ...commands.image,
      icon: <span className="typecho-markdown-icon typecho-markdown-icon-image" />,
      execute: openImageDialog,
    },
    commands.divider,
    { ...commands.orderedListCommand, icon: <span className="typecho-markdown-icon typecho-markdown-icon-ordered-list" /> },
    { ...commands.unorderedListCommand, icon: <span className="typecho-markdown-icon typecho-markdown-icon-unordered-list" /> },
    { ...commands.title, icon: <span className="typecho-markdown-icon typecho-markdown-icon-heading" /> },
    { ...commands.hr, icon: <span className="typecho-markdown-icon typecho-markdown-icon-thematic-break" /> },
  ];

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
          <ExternalLink aria-hidden="true" />
          预览文章
        </button>
        <button type="button" className="btn fullscreen-toolbar-button" onClick={() => submitPost("draft")}>
          <Save aria-hidden="true" />
          保存草稿
        </button>
        <button type="button" className="btn primary fullscreen-toolbar-button" onClick={() => submitPost("published")}>
          <Send aria-hidden="true" />
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
      const nextHeight = Math.max(MIN_EDITOR_HEIGHT, startHeight + pointerEvent.clientY - startY);
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
      <div ref={editorShellRef} className="typecho-uiw-editor" data-color-mode="light">
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
          textareaProps={{
            id: "markdown-editor-source",
            "aria-label": "Markdown 内容",
            onPaste: pasteClipboardImages,
          }}
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
        {isImageDialogOpen && (
          <div className="typecho-image-dialog-backdrop" role="presentation">
            <div
              className="typecho-image-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="typecho-image-dialog-title"
            >
              <p id="typecho-image-dialog-title"><b>插入图片</b></p>
              <p>请在下方的输入框内输入要插入的远程图片地址</p>
              <p>您也可以使用附件功能插入上传的本地图片</p>
              <input
                ref={imageUrlInputRef}
                type="url"
                value={imageUrl}
                aria-label="远程图片地址"
                onChange={(event) => setImageUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    insertImage();
                  }
                  if (event.key === "Escape") closeImageDialog();
                }}
              />
              <div className="typecho-image-dialog-actions">
                <button type="button" className="btn btn-s primary" onClick={insertImage}>确定</button>
                <button type="button" className="btn btn-s" onClick={closeImageDialog}>取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
