import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于",
};

export default function AboutPage() {
  return (
    <article className="post lite-about-page">
      <header className="lite-about-header">
        <h1>
          <Link href="/start-page.html">关于</Link>
        </h1>
        <p>人生如逆旅，我亦是行人。</p>
      </header>

      <div className="lite-about-content">
        <section aria-labelledby="about-introduction">
          <span className="lite-about-index" aria-hidden="true">01</span>
          <div>
            <h2 id="about-introduction">你好，我是 Faris</h2>
            <p>
              欢迎来到 <strong>Dust In The Wind</strong>。这里是我的个人博客，
              用来整理开发过程中的实践、思考与生活片段，也希望这些真实的记录能为你提供一点参考。
            </p>
          </div>
        </section>

        <section aria-labelledby="about-writing">
          <span className="lite-about-index" aria-hidden="true">02</span>
          <div>
            <h2 id="about-writing">这里记录什么</h2>
            <ul>
              <li>编程实践、项目重构与工程化经验</li>
              <li>Next.js、Astro 和现代 Web 开发</li>
              <li>性能优化、部署运维与问题排查</li>
              <li>偶尔出现的日常随笔与生活记录</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="about-site">
          <span className="lite-about-index" aria-hidden="true">03</span>
          <div>
            <h2 id="about-site">关于本站</h2>
            <p>
              本站基于 Next.js 构建，文章使用 Markdown 与受控 MDX 编写，
              支持代码高亮、LaTeX 公式和 Mermaid 图表。界面与主题仍在持续打磨中。
            </p>
          </div>
        </section>

        <section className="lite-about-contact" aria-labelledby="about-contact">
          <span className="lite-about-index" aria-hidden="true">04</span>
          <div>
            <h2 id="about-contact">保持联系</h2>
            <p>如果你对文章内容或项目感兴趣，欢迎通过下面的方式与我交流。</p>
            <div className="lite-about-links">
              <a href="https://github.com/farisni" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="mailto:wenmengshaonian@gmail.com">
                Email
              </a>
              <Link href="/feed.xml">RSS</Link>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
