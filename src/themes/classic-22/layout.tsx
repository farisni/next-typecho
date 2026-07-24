import { Classic22Footer } from "@/themes/classic-22/footer";
import { Classic22Header } from "@/themes/classic-22/header";
import type { ClassicThemeConfig } from "@/themes/classic-22/definition";
import type { ThemeLayoutProps } from "@/themes/types";

export function Classic22ThemeLayout({
  name,
  description,
  config,
  customStyle,
  previewBar,
  children,
}: ThemeLayoutProps<ClassicThemeConfig>) {
  return (
    <div className="theme-classic-22" data-theme={config.colorSchema}>
      {customStyle}
      {previewBar}
      <Classic22Header
        name={name}
        description={description}
        logoUrl={config.logoUrl}
      />
      <main className="classic-container classic-main">
        <div className="classic-container-thin">{children}</div>
      </main>
      <Classic22Footer siteName={name} />
    </div>
  );
}
