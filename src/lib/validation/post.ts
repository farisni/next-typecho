import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(1, "请输入文章标题").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "请输入文章路径")
    .max(120)
    .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "路径只能包含中英文字母、数字和连字符"),
  excerpt: z.string().trim().max(300).optional(),
  coverImage: z
    .string()
    .trim()
    .max(500)
    .regex(/^\/uploads\/[a-z0-9-]+\.(?:gif|jpe?g|png|webp)$/, "文章配图地址无效")
    .optional(),
  content: z.string().trim().min(1, "请输入文章内容"),
  status: z.enum(["draft", "published", "waiting", "hidden", "private"]),
  allowComment: z.boolean(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
});

export type PostInput = z.infer<typeof postSchema>;
