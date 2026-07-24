import { z } from "zod";

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(32, "昵称不能超过 32 个字符")
    .refine((value) => !/[<>]/.test(value), "请不要在昵称中使用特殊字符"),
  url: z
    .string()
    .trim()
    .max(500, "个人主页地址长度超过限制")
    .refine((value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "个人主页地址格式错误"),
  email: z.string().trim().min(1, "必须填写电子邮箱").max(254).email("电子邮箱格式错误"),
});

export const writingPreferencesSchema = z.object({
  markdown: z.boolean(),
  xmlrpcMarkdown: z.boolean(),
  autoSave: z.boolean(),
  defaultAllowComment: z.boolean(),
  defaultAllowPing: z.boolean(),
  defaultAllowFeed: z.boolean(),
});

export const profilePasswordSchema = z
  .object({
    password: z.string().min(6, "为了保证账户安全, 请输入至少六位的密码").max(200),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "两次输入的密码不一致",
    path: ["confirm"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type WritingPreferencesInput = z.infer<typeof writingPreferencesSchema>;
