import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于",
};

export default function AboutPage() {
  return (
    <article className="post">
      <h1 className="post-title">
        <Link href="/start-page.html">关于</Link>
      </h1>
      <div className="post-content">
        <p>本页面由 Typecho 创建, 这只是个测试页面.</p>
      </div>
    </article>
  );
}