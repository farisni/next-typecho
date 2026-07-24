import { AdminFooter } from "@/components/admin/admin-footer";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdministrator } from "@/lib/auth/session";
import { requireInstallation } from "@/lib/bootstrap/install-guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  requireInstallation();
  // Proxy 只做 Cookie 存在性快检；后台布局必须再次向数据库验证会话。
  const user = await requireAdministrator();

  return (
    <div className="typecho-admin">
      <AdminNav user={user} />
      <main className="typecho-admin-main">
        <div className="admin-container">{children}</div>
      </main>
      <AdminFooter />
    </div>
  );
}
