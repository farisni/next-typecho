import { readFile } from "node:fs/promises";
import path from "node:path";
import { getUploadDirectory } from "@/lib/storage/upload-directory";

export const runtime = "nodejs";

const UPLOAD_FILENAME_PATTERN =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(?:gif|jpe?g|png|webp)$/i;
const IMAGE_MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function readUploadedImage(filename: string) {
  const directories = [
    getUploadDirectory(),
    path.join(process.cwd(), "public", "uploads"),
  ];

  for (const directory of directories) {
    try {
      return await readFile(path.join(directory, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!UPLOAD_FILENAME_PATTERN.test(filename)) {
    return new Response(null, { status: 404 });
  }

  try {
    const image = await readUploadedImage(filename);
    if (!image) return new Response(null, { status: 404 });

    const extension = path.extname(filename).toLowerCase();
    return new Response(new Uint8Array(image), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(image.byteLength),
        "Content-Type": IMAGE_MIME_TYPES[extension] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
