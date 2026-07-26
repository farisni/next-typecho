import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ImageStorage, StoredImage } from "@/lib/storage/storage";
import { getUploadDirectory } from "@/lib/storage/upload-directory";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 82;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

export class LocalImageStorage implements ImageStorage {
  async save(file: File): Promise<StoredImage> {
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) throw new Error("仅支持 JPG、PNG、GIF 和 WebP 图片");
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      throw new Error("图片大小必须在 5 MB 以内");
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const shouldPreserveAnimation = file.type === "image/gif";
    const imageBuffer = shouldPreserveAnimation
      ? originalBuffer
      : await sharp(originalBuffer)
          .rotate()
          .resize({
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();
    const outputExtension = shouldPreserveAnimation ? extension : ".webp";
    const outputMimeType = shouldPreserveAnimation ? file.type : "image/webp";
    const key = `${randomUUID()}${outputExtension}`;
    const uploadDirectory = getUploadDirectory();
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, key), imageBuffer);

    return {
      url: `/uploads/${key}`,
      key,
      size: imageBuffer.byteLength,
      mimeType: outputMimeType,
    };
  }
}

// 业务代码只依赖 ImageStorage 接口，未来可在此切换 S3、R2 等对象存储。
export const imageStorage: ImageStorage = new LocalImageStorage();
