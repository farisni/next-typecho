import type { ReactNode } from "react";
import type { z } from "zod";
import type { AuthUser } from "@/lib/auth/session";

export type ThemeSourceFile = {
  name: string;
  language: string;
  content: string;
  editable: false;
};

export type ThemeTextSetting = {
  kind: "url";
  name: string;
  label: string;
  description: string;
  placeholder?: string;
};

export type ThemeSelectSetting = {
  kind: "select";
  name: string;
  label: string;
  description: string;
  options: readonly { value: string; label: string }[];
};

export type ThemeCheckboxGroupSetting = {
  kind: "checkbox-group";
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
};

export type ThemeSettingField =
  | ThemeTextSetting
  | ThemeSelectSetting
  | ThemeCheckboxGroupSetting;

export type ThemeDefinition<TConfig extends object> = {
  slug: string;
  title: string;
  author: string;
  homepage: string;
  version: string;
  description: string;
  screenshotPath: string;
  defaults: TConfig;
  configSchema: z.ZodType<TConfig>;
  settings: readonly ThemeSettingField[];
  sourceFiles: readonly ThemeSourceFile[];
};

export type ThemeLayoutProps<TConfig extends object> = {
  name: string;
  description: string;
  user: AuthUser | null;
  config: TConfig;
  customStyle: ReactNode;
  previewBar: ReactNode;
  children: ReactNode;
};

export const builtInThemeSourceNotice = `/**
 * Next Typecho 内置主题
 *
 * 内置 React/TypeScript 模板随应用构建并以只读方式展示。
 * 在线修改可执行源码会破坏 RSC 和构建产物一致性，因此请使用 custom.css
 * 完成无需重新构建的外观覆盖；本地开发时可直接修改 src/themes 下的主题组件。
 */`;
