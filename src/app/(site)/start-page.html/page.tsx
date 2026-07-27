import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Rss } from "lucide-react";

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
              <a href="https://github.com/farisni" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.16 1.19a10.97 10.97 0 0 1 5.76 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.07.74.81 1.19 1.84 1.19 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
                </svg>
              </a>
              <a href="mailto:wenmengshaonian@gmail.com" aria-label="发送邮件">
                <Mail aria-hidden="true" />
              </a>
              <Link href="/feed.xml" aria-label="RSS 订阅">
                <Rss aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
