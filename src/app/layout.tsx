import type { Metadata } from "next";
import "@uiw/react-md-editor/markdown-editor.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Next Typecho",
    template: "%s · Next Typecho",
  },
  description: "使用 Next.js 构建的轻量博客 CMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
