import Link from "next/link";

export function Classic22Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="classic-footer">
      <div className="classic-container classic-footer-inner">
        <ul>
          <li>&copy; {new Date().getFullYear()} <Link href="/">{siteName}</Link></li>
          <li><Link href="/">RSS</Link></li>
        </ul>
        <ul><li>Powered by <a href="https://typecho.org">Typecho</a></li></ul>
      </div>
    </footer>
  );
}
