"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { Pencil, X } from "lucide-react";
import { uploadImage } from "@/actions/upload-image";

type Attachment = {
  id: string;
  name: string;
  size: number;
  url: string;
};

type PostSidebarProps = {
  children: ReactNode;
};

export function PostSidebar({ children }: PostSidebarProps) {
  const [activeTab, setActiveTab] = useState<"options" | "attachments">("options");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleAttachmentUploaded(event: Event) {
      const attachment = (event as CustomEvent<Attachment>).detail;
      setAttachments((current) => {
        if (current.some((item) => item.id === attachment.id)) return current;
        return [...current, attachment];
      });
    }

    window.addEventListener("typecho:attachment-uploaded", handleAttachmentUploaded);
    return () => window.removeEventListener("typecho:attachment-uploaded", handleAttachmentUploaded);
  }, []);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadError("");
    setIsUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.set("image", file);
        const storedImage = await uploadImage(formData);

        setAttachments((current) => [
          ...current,
          {
            id: storedImage.key,
            name: file.name,
            size: storedImage.size,
            url: storedImage.url,
          },
        ]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败，请稍后重试");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void uploadFiles(event.dataTransfer.files);
  }

  function insertAttachment(attachment: Attachment) {
    window.dispatchEvent(
      new CustomEvent("typecho:insert-attachment", {
        detail: { name: attachment.name, url: attachment.url },
      }),
    );
  }

  return (
    <>
      <ul className="typecho-option-tabs post-option-tabs">
        <li className={activeTab === "options" ? "active" : undefined}>
          <button type="button" onClick={() => setActiveTab("options")}>选项</button>
        </li>
        <li className={activeTab === "attachments" ? "active" : undefined}>
          <button type="button" onClick={() => setActiveTab("attachments")}>
            附件
            {attachments.length > 0 && <span className="attachment-count">{attachments.length}</span>}
          </button>
        </li>
      </ul>

      <div hidden={activeTab !== "options"}>{children}</div>
      <div className="post-attachment-tab" hidden={activeTab !== "attachments"}>
        <div className={`upload-panel${isDragging ? " drag" : ""}`}>
          <div
            className="upload-area"
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <span>
              {isUploading ? "正在上传..." : "拖放文件到这里"}
              <br />
              或者{" "}
              <button
                type="button"
                className="upload-file"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                选择文件上传
              </button>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              hidden
              onChange={(event) => {
                if (event.currentTarget.files) void uploadFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
            />
          </div>

          {uploadError && <p className="upload-message error">{uploadError}</p>}

          {attachments.length > 0 && (
            <ul className="attachment-file-list">
              {attachments.map((attachment) => (
                <li key={attachment.id}>
                  <button
                    type="button"
                    className="attachment-insert"
                    title="点击插入图片"
                    onClick={() => insertAttachment(attachment)}
                  >
                    {attachment.name}
                  </button>
                  <div className="attachment-info">
                    <span>{Math.ceil(attachment.size / 1024)} KB</span>
                    <a href={attachment.url} target="_blank" rel="noreferrer" title="查看图片">
                      <Pencil aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      title="从列表移除"
                      onClick={() => {
                        setAttachments((current) => current.filter((item) => item.id !== attachment.id));
                      }}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
