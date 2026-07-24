import Link from "next/link";

export function Footer() {
  return (
    <footer className="handsome-footer">
      <div className="handsome-footer-links">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
          ICP备案信息
        </a>
        <span aria-hidden="true">|</span>
        <a href="https://www.beian.gov.cn/" target="_blank" rel="noreferrer">
          公安备案信息
        </a>
        <span aria-hidden="true">|</span>
        <Link href="/sitemap.xml">Sitemap</Link>
      </div>
      <p>
        Powered by <a href="https://nextjs.org/">Next.js</a>
      </p>
    </footer>
  );
}
