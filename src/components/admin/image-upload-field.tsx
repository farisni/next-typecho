"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClipboardEvent as ReactClipboardEvent,
  DragEvent,
} from "react";
import { ImageIcon, Scissors, Trash2, Upload, X } from "lucide-react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { uploadImage } from "@/actions/upload-image";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  description?: string;
  defaultValue?: string | null;
};

const IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";
const CROP_RATIOS = [
  { label: "3:2 卡片", value: 3 / 2 },
  { label: "16:9 通用", value: 16 / 9 },
  { label: "16:5 横幅", value: 16 / 5 },
] as const;

async function cropImage(
  file: File,
  crop: PixelCrop,
  renderedWidth: number,
  renderedHeight: number,
) {
  const bitmap = await createImageBitmap(file);

  try {
    if (!crop.width || !crop.height || !renderedWidth || !renderedHeight) {
      throw new Error("请先选择需要保留的图片区域");
    }

    const scaleX = bitmap.width / renderedWidth;
    const scaleY = bitmap.height / renderedHeight;
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;
    const outputScale = Math.min(1, 1600 / sourceWidth);
    const outputWidth = Math.max(1, Math.round(sourceWidth * outputScale));
    const outputHeight = Math.max(1, Math.round(sourceHeight * outputScale));
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("当前浏览器无法裁切图片");

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("生成裁切图片失败"));
        },
        "image/webp",
        0.92,
      );
    });

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "cover"}.webp`, {
      type: "image/webp",
    });
  } finally {
    bitmap.close();
  }
}

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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState("");
  const [cropRatio, setCropRatio] = useState<number>(3 / 2);
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isLoadingCrop, setIsLoadingCrop] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

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

  const prepareCrop = useCallback((file?: File | null) => {
    if (!file || isUploading) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingPreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return objectUrl;
    });
    setPendingFile(file);
    setCropRatio(3 / 2);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setError("");
  }, [isUploading]);

  function closeCrop() {
    setPendingFile(null);
    setPendingPreviewUrl("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsCropping(false);
  }

  async function confirmCrop() {
    const image = cropImageRef.current;
    if (!pendingFile || !completedCrop || !image || isCropping) return;

    setIsCropping(true);
    try {
      const croppedFile = await cropImage(
        pendingFile,
        completedCrop,
        image.width,
        image.height,
      );
      closeCrop();
      await upload(croppedFile);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "裁切图片失败");
      setIsCropping(false);
    }
  }

  async function editCurrentCrop() {
    if (!previewUrl || isUploading || isLoadingCrop) return;

    setIsLoadingCrop(true);
    setError("");

    try {
      const response = await fetch(previewUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("读取当前配图失败");

      const blob = await response.blob();
      const file = new File([blob], "cover-current.webp", {
        type: blob.type || "image/webp",
      });
      prepareCrop(file);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "读取当前配图失败");
    } finally {
      setIsLoadingCrop(false);
    }
  }

  function createCenteredCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
  ) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 88,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  function selectCropRatio(ratio: number) {
    setCropRatio(ratio);
    const image = cropImageRef.current;
    if (!image) return;

    const nextCrop = createCenteredCrop(image.width, image.height, ratio);
    setCrop(nextCrop);
    setCompletedCrop(convertToPixelCrop(nextCrop, image.width, image.height));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    prepareCrop(event.dataTransfer.files[0]);
  }

  function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const imageFile = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();

    if (!imageFile) return;

    event.preventDefault();
    prepareCrop(imageFile);
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

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
      prepareCrop(imageFile);
    }

    document.addEventListener("paste", handleDocumentPaste);
    return () => document.removeEventListener("paste", handleDocumentPaste);
  }, [prepareCrop]);

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
        onPointerDown={(event) => event.currentTarget.focus()}
      >
        {previewUrl ? (
          <div className="image-upload-preview">
            <img src={previewUrl} alt={`${label}预览`} />
            {isUploading && <span className="image-upload-progress">正在上传...</span>}
            <div className="image-upload-actions">
              {hasMounted && (
                <button
                  type="button"
                  disabled={isUploading || isLoadingCrop}
                  onClick={() => void editCurrentCrop()}
                >
                  <Scissors aria-hidden="true" />
                  {isLoadingCrop ? "读取中" : "裁切"}
                </button>
              )}
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
            prepareCrop(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </div>

      {error && <p className="image-upload-error">{error}</p>}

      {pendingFile && pendingPreviewUrl && (
        <div className="image-crop-overlay" role="presentation">
          <section
            className="image-crop-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-crop-title"
          >
            <header className="image-crop-header">
              <div>
                <Scissors aria-hidden="true" />
                <div>
                  <strong id="image-crop-title">裁切卡片配图</strong>
                  <small>选择画幅并调整图片显示区域</small>
                </div>
              </div>
              <button type="button" aria-label="关闭裁切" onClick={closeCrop}>
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="image-crop-preview">
              <ReactCrop
                crop={crop}
                aspect={cropRatio}
                keepSelection
                ruleOfThirds
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              >
                <img
                  ref={cropImageRef}
                  src={pendingPreviewUrl}
                  alt="待裁切的文章卡片配图"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    const nextCrop = createCenteredCrop(image.width, image.height, cropRatio);
                    setCrop(nextCrop);
                    setCompletedCrop(convertToPixelCrop(nextCrop, image.width, image.height));
                  }}
                />
              </ReactCrop>
            </div>

            <div className="image-crop-ratios" aria-label="选择图片画幅">
              {CROP_RATIOS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={cropRatio === option.value ? "is-active" : ""}
                  onClick={() => selectCropRatio(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <footer className="image-crop-actions">
              <button type="button" onClick={closeCrop} disabled={isCropping}>
                取消
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => void confirmCrop()}
                disabled={isCropping || !completedCrop}
              >
                <Upload aria-hidden="true" />
                {isCropping ? "正在处理..." : "应用并上传"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
