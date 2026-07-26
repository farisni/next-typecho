import { z } from "zod";

export const publicCommentSchema = z.object({
  postId: z.string().uuid(),
  postSlug: z.string().min(1).max(120),
  parentId: z.string().uuid().optional(),
  author: z.string().trim().min(1, "必须填写称呼").max(150, "称呼最多包含 150 个字符"),
  mail: z.string().trim().max(150, "邮箱最多包含 150 个字符"),
  url: z.string().trim().max(255, "网址最多包含 255 个字符"),
  text: z.string().trim().min(1, "必须填写评论内容").max(10000, "评论内容过长"),
  company: z.string().max(200).optional(),
});

export const adminCommentEditSchema = z.object({
  author: z.string().trim().min(1).max(150),
  mail: z.string().trim().max(150),
  url: z.string().trim().max(255),
  text: z.string().trim().min(1).max(10000),
});

export const adminCommentReplySchema = z.object({
  text: z.string().trim().min(1).max(10000),
});
