export default function NotFound() {
  return (
    <div className="error-page">
      <h2 className="post-title">404 - 页面没找到</h2>
      <p>你想查看的页面已被转移或删除了，要不要搜索看看：</p>
      <form action="/">
        <p><input name="q" type="text" autoFocus /></p>
        <p><button type="submit">搜索</button></p>
      </form>
    </div>
  );
}
