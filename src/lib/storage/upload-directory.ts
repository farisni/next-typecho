import { homedir } from "node:os";
import path from "node:path";

export function getUploadDirectory() {
  return path.join(homedir(), "data", "next-typecho", "uploads");
}
