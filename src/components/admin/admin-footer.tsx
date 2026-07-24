export function AdminFooter() {
  return (
    <footer className="typecho-foot" role="contentinfo">
      <div className="admin-logo" aria-label="Next Typecho">T</div>
      <p>由 <a href="https://typecho.org">Typecho</a> 管理界面样式驱动，Next.js 复刻版</p>
      <nav className="admin-resource">
        <a href="https://docs.typecho.org">帮助文档</a> · <a href="https://forum.typecho.org">支持论坛</a> · <a href="https://github.com/typecho/typecho/issues">报告错误</a>
      </nav>
    </footer>
  );
}
