import { z } from "zod";

export const databaseModeSchema = z.enum(["none", "keep", "delete"]);

export const installAdministratorSchema = z.object({
  siteUrl: z
    .string()
    .trim()
    .min(1, "请填写站点地址")
    .url("请填写一个合法的 URL 地址")
    .max(500)
    .refine((value) => /^https?:\/\//i.test(value), "站点地址必须使用 HTTP 或 HTTPS"),
  username: z
    .string()
    .trim()
    .min(1, "必须填写用户名称")
    .max(32, "用户名长度超过限制，请不要超过 32 个字符")
    .regex(/^[\p{L}\p{N}_.@-]+$/u, "请不要在用户名中使用特殊字符"),
  password: z
    .string()
    .min(8, "密码至少需要 8 个字符；也可以留空由系统自动生成")
    .max(200, "密码长度超过限制")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "必须填写电子邮箱")
    .email("电子邮箱格式错误")
    .max(200, "邮箱长度超过限制，请不要超过 200 个字符"),
});

export type InstallAdministratorInput = z.infer<typeof installAdministratorSchema>;