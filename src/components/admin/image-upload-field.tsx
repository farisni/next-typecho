"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClipboardEvent as ReactClipboardEvent, DragEvent } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { uploadImage } from "@/actions/upload-image";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  description?: string;
  defaultValue?: string | null;
};

const IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";

export function ImageUploadField({
  name,
  label,
  description,
  defaultValue,
}: ImageUploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultValue ?? "");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file?: File) => {
    if (!file || isUploading) return;

    const temporaryUrl = URL.createObjectURL(file);
    setPreviewUrl(temporaryUrl);
    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("image", file);
      const storedImage = await uploadImage(formData);
      setValue(storedImage.url);
      setPreviewUrl(storedImage.url);
    } catch (uploadError) {
      setPreviewUrl(value);
      setError(uploadError instanceof Error ? uploadError.message : "上传失败，请稍后重试");
    } finally {
      URL.revokeObjectURL(temporaryUrl);
      setIsUploading(false);
    }
  }, [isUploading, value]);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void upload(event.dataTransfer.files[0]);
  }

  function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const imageFile = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();

    if (!imageFile) return;

    event.preventDefault();
    void upload(imageFile);
  }

  useEffect(() => {
    function handleDocumentPaste(event: ClipboardEvent) {
      if (event.defaultPrevented) return;

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const imageFile = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile();

      if (!imageFile) return;

      event.preventDefault();
      void upload(imageFile);
    }

    document.addEventListener("paste", handleDocumentPaste);
    return () => document.removeEventListener("paste", handleDocumentPaste);
  }, [upload]);

  return (
    <section className="image-upload-field">
      <input type="hidden" name={name} value={value} />
      <div className="image-upload-heading">
        <ImageIcon aria-hidden="true" />
        <div>
          <strong>{label}</strong>
          {description && <small>{description}</small>}
        </div>
      </div>

      <div
        className={`image-upload-dropzone${isDragging ? " is-dragging" : ""}${previewUrl ? " has-image" : ""}`}
        tabIndex={0}
        title="点击此区域后可直接粘贴剪贴板图片"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        {previewUrl ? (
          <div className="image-upload-preview">
            <img src={previewUrl} alt={`${label}预览`} />
            {isUploading && <span className="image-upload-progress">正在上传...</span>}
            <div className="image-upload-actions">
              <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}>
                <Upload aria-hidden="true" />
                更换
              </button>
              <button
                type="button"
                className="is-danger"
                disabled={isUploading}
                onClick={() => {
                  setValue("");
                  setPreviewUrl("");
                  setError("");
                }}
              >
                <Trash2 aria-hidden="true" />
                移除
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="image-upload-empty"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden="true" />
            <span>{isUploading ? "正在上传..." : "选择、拖放或粘贴图片到这里"}</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES}
          hidden
          onChange={(event) => {
            void upload(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </div>

      {error && <p className="image-upload-error">{error}</p>}
    </section>
  );
}
