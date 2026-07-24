import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(1, "请输入文章标题").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "请输入文章路径")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "路径只能包含小写字母、数字和连字符"),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().trim().min(1, "请输入文章内容"),
  status: z.enum(["draft", "published", "waiting", "hidden", "private"]),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
});

export type PostInput = z.infer<typeof postSchema>;
