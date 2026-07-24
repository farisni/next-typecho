import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImageStorage, StoredImage } from "@/lib/storage/storage";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
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

    const key = `${randomUUID()}${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, key), Buffer.from(await file.arrayBuffer()));

    return { url: `/uploads/${key}`, key, size: file.size, mimeType: file.type };
  }
}

// 业务代码只依赖 ImageStorage 接口，未来可在此切换 S3、R2 等对象存储。
export const imageStorage: ImageStorage = new LocalImageStorage();
