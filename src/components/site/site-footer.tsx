import Link from "next/link";

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer id="footer" role="contentinfo">
      &copy; {new Date().getFullYear()} <Link href="/">{siteName}</Link>. 由 <a href="https://nextjs.org">Nextjs</a> 强力驱动.
    </footer>
  );
}
