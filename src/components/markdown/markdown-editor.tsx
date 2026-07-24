"use client";

import { useRef, useState, useTransition } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  MDXEditorMethods,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
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
  const editorRef = useRef<MDXEditorMethods>(null);

  async function uploadImageForEditor(image: File) {
    const formData = new FormData();
    formData.set("image", image);
    const uploadedImage = await uploadImage(formData);
    return uploadedImage.url;
  }

  function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return setUploadMessage("请先选择图片");

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.set("image", file);
        const image = await uploadImage(formData);
        const imageMarkdown = `![图片描述](${image.url})`;
        if (editorRef.current) {
          editorRef.current.insertMarkdown(imageMarkdown);
        } else {
          setContent((current) => `${current}${current ? "\n\n" : ""}${imageMarkdown}`);
        }
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
        <div className="wmd-edittab">
          <button type="button" className={mode === "write" ? "active" : undefined} onClick={() => setMode("write")}>撰写</button>
          <button type="button" className={mode === "preview" ? "active" : undefined} onClick={() => setMode("preview")}>预览</button>
        </div>
      </div>
      <label className="sr-only" htmlFor="content">Markdown 内容</label>
      <textarea id="content" name="content" className="editor-value" value={content} onChange={() => undefined} required readOnly />
      {mode === "write" ? (
        <div className="typecho-mdx-editor">
          <MDXEditor
            ref={editorRef}
            markdown={content}
            onChange={setContent}
            contentEditableClassName="typecho-mdx-content"
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
              codeMirrorPlugin({
                codeBlockLanguages: {
                  text: "纯文本",
                  javascript: "JavaScript",
                  typescript: "TypeScript",
                  markdown: "Markdown",
                  html: "HTML",
                  css: "CSS",
                  json: "JSON",
                  bash: "Bash",
                },
              }),
              tablePlugin(),
              markdownShortcutPlugin(),
              imagePlugin({ imageUploadHandler: uploadImageForEditor }),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <Separator />
                    <BoldItalicUnderlineToggles />
                    <CreateLink />
                    <InsertImage />
                    <Separator />
                    <ListsToggle options={["number", "bullet"]} />
                    <BlockTypeSelect />
                    <CodeToggle />
                    <InsertTable />
                    <InsertThematicBreak />
                  </>
                ),
              }),
            ]}
          />
        </div>
      ) : (
        <div className="wmd-preview">{content ? <MarkdownContent content={content} /> : <p>预览会在输入后显示。</p>}</div>
      )}
      <div className="upload-panel">
        <div className="upload-area">
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" />
          <button type="button" className="btn btn-s" disabled={isUploading} onClick={handleUpload}>{isUploading ? "上传中..." : "上传并插入图片"}</button>
        </div>
        {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
      </div>
    </div>
  );
}
