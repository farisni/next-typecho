import type { Metadata } from "next";
import "@mdxeditor/editor/style.css";
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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
