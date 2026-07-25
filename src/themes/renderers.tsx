import type { ComponentType } from "react";
import {
  type DefaultThemeConfig,
} from "@/themes/default/definition";
import { DefaultThemeLayout } from "@/themes/default/layout";
import {
  type HandsomeThemeConfig,
} from "@/themes/handsome/definition";
import { HandsomeThemeLayout } from "@/themes/handsome/layout";
import {
  type LiteThemeConfig,
} from "@/themes/lite/definition";
import { LiteThemeLayout } from "@/themes/lite/layout";
import {
  type PaperThemeConfig,
} from "@/themes/paper/definition";
import { PaperThemeLayout } from "@/themes/paper/layout";
import type { ThemeConfig, ThemeSlug } from "@/lib/themes/registry";
import type { ThemeLayoutProps } from "@/themes/types";

type RegisteredThemeLayout = ComponentType<ThemeLayoutProps<ThemeConfig>>;

const DefaultRenderer: RegisteredThemeLayout = (props) => (
  <DefaultThemeLayout
    {...props}
    config={props.config as DefaultThemeConfig}
  />
);

const HandsomeRenderer: RegisteredThemeLayout = (props) => (
  <HandsomeThemeLayout
    {...props}
    config={props.config as HandsomeThemeConfig}
  />
);

const LiteRenderer: RegisteredThemeLayout = (props) => (
  <LiteThemeLayout
    {...props}
    config={props.config as LiteThemeConfig}
  />
);

const PaperRenderer: RegisteredThemeLayout = (props) => (
  <PaperThemeLayout
    {...props}
    config={props.config as PaperThemeConfig}
  />
);

const themeRenderers = {
  default: DefaultRenderer,
  handsome: HandsomeRenderer,
  lite: LiteRenderer,
  paper: PaperRenderer,
} satisfies Record<ThemeSlug, RegisteredThemeLayout>;

export function getThemeRenderer(slug: ThemeSlug): RegisteredThemeLayout {
  return themeRenderers[slug];
}
