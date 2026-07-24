import type { ComponentType } from "react";
import {
  type ClassicThemeConfig,
} from "@/themes/classic-22/definition";
import { Classic22ThemeLayout } from "@/themes/classic-22/layout";
import {
  type DefaultThemeConfig,
} from "@/themes/default/definition";
import { DefaultThemeLayout } from "@/themes/default/layout";
import type { ThemeConfig, ThemeSlug } from "@/lib/themes/registry";
import type { ThemeLayoutProps } from "@/themes/types";

type RegisteredThemeLayout = ComponentType<ThemeLayoutProps<ThemeConfig>>;

const DefaultRenderer: RegisteredThemeLayout = (props) => (
  <DefaultThemeLayout
    {...props}
    config={props.config as DefaultThemeConfig}
  />
);

const Classic22Renderer: RegisteredThemeLayout = (props) => (
  <Classic22ThemeLayout
    {...props}
    config={props.config as ClassicThemeConfig}
  />
);

const themeRenderers = {
  default: DefaultRenderer,
  "classic-22": Classic22Renderer,
} satisfies Record<ThemeSlug, RegisteredThemeLayout>;

export function getThemeRenderer(slug: ThemeSlug): RegisteredThemeLayout {
  return themeRenderers[slug];
}
