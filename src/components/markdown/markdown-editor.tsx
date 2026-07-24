"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImage } from "@/actions/upload-image";
import { MarkdownContent } from "@/components/markdown/markdown-content";

type MarkdownEditorProps = {
  defaultValue?: string;
};

export function MarkdownEditor({ defaultValue = "" }: MarkdownEditorProps) {
  const [content, setContent] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return setUploadMessage("请先选择图片");

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.set("image", file);
        const image = await uploadImage(formData);
        setContent((current) => `${current}${current ? "\n\n" : ""}![图片描述](${image.url})`);
        setUploadMessage("上传成功，Markdown 图片语法已插入正文");
        if (fileInput.current) fileInput.current.value = "";
      } catch (error) {
        setUploadMessage(error instanceof Error ? error.message : "上传失败");
      }
    });
  }

  return (
    <div className="editor">
      <div className="wmd-button-bar">
        <div className="wmd-button-row" aria-hidden="true"><span><strong>B</strong></span><span><em>I</em></span><i></i><span>🔗</span><span>❝</span><span>&lt;/&gt;</span><span>▧</span><i></i><span>1.</span><span>•</span><span>H</span></div>
        <div className="wmd-edittab"><button type="button" className={mode === "write" ? "active" : undefined} onClick={() => setMode("write")}>撰写</button><button type="button" className={mode === "preview" ? "active" : undefined} onClick={() => setMode("preview")}>预览</button></div>
      </div>
      <label className="sr-only" htmlFor="content">Markdown 内容</label>
      <textarea id="content" name="content" className={mode === "write" ? "editor-text mono" : "editor-text mono hidden-editor"} value={content} onChange={(event) => setContent(event.target.value)} required />
      {mode === "preview" && <div className="wmd-preview">{content ? <MarkdownContent content={content} /> : <p>预览会在输入后显示。</p>}</div>}
      <div className="upload-panel">
        <div className="upload-area">
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" />
          <button type="button" className="btn btn-s" disabled={isUploading} onClick={handleUpload}>{isUploading ? "上传中…" : "上传并插入图片"}</button>
        </div>
        {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
      </div>
    </div>
  );
}
