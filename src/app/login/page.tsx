import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  getCurrentUser,
  getRememberPreference,
  sanitizeAdminReferer,
} from "@/lib/auth/session";
import { requireInstallation } from "@/lib/bootstrap/install-guard";

export const metadata: Metadata = {
  title: "登录",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ referer?: string; logout?: string }>;
}) {
  requireInstallation();
  const query = await searchParams;
  const referer = sanitizeAdminReferer(query.referer);
  const [user, defaultRemember] = await Promise.all([
    getCurrentUser(),
    getRememberPreference(),
  ]);

  if (user) redirect(referer);

  return (
    <main className="typecho-admin typecho-login-page">
      <div className="typecho-login-wrap">
        <div className="typecho-login">
          <h1><a href="https://typecho.org" className="login-logo">Typecho</a></h1>
          {query.logout === "1" && <p className="message success">您已成功登出</p>}
          <LoginForm referer={referer} defaultRemember={defaultRemember} />
          <p className="more-link"><Link href="/">返回首页</Link></p>
        </div>
      </div>
    </main>
  );
}