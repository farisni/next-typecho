import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { listAllPostsForAdmin } from "@/lib/repositories/posts";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [posts, { categories }] = await Promise.all([listAllPostsForAdmin(), listTaxonomies()]);
  const published = posts.filter((post) => post.status === "published");

  return (
    <>
      <AdminPageTitle title="网站概要" />
      <div className="typecho-dashboard">
        <div className="welcome-board">
          <p>
            目前有 <em>{published.length}</em> 篇文章，并有 <em>0</em> 条评论在 <em>{categories.length}</em> 个分类中。
            <br />
            <span className="quick-start-hint">点击下面的链接快速开始：</span>
          </p>
          <ul id="start-link">
            <li><Link href="/admin/posts/new">撰写新文章</Link></li>
            <li><Link href="/admin/categories">管理分类</Link></li>
            <li><Link href="/admin/themes">更换外观</Link></li>
            <li><Link href="/admin/settings">系统设置</Link></li>
          </ul>
        </div>
        <div className="dashboard-columns">
          <section className="latest-link">
            <h3>最近发布的文章</h3>
            <ul>{published.slice(0, 10).map((post) => <li key={post.id}><span>{post.publishedAt?.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span><Link href={`/posts/${post.slug}`}>{post.title}</Link></li>)}</ul>
          </section>
          <section className="latest-link">
            <h3>最近得到的回复</h3>
            <ul><li>暂时没有回复</li></ul>
          </section>
          <section className="latest-link">
            <h3>系统信息</h3>
            <ul>
              <li><span>运行</span>Next.js 16 + SQLite</li>
              <li><span>状态</span>开发模式</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
