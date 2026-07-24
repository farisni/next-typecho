import { AdminPageTitle } from "@/components/admin/admin-page-title";
import {
  ProfileDetailsForm,
  ProfilePasswordForm,
  ProfileWritingOptionsForm,
} from "@/components/admin/profile-forms";
import { requireAdministrator } from "@/lib/auth/session";
import { getProfilePageData } from "@/lib/repositories/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await requireAdministrator("/admin/profile");
  const { user, preferences, stats } = getProfilePageData(currentUser.id);

  return (
    <div className="profile-page-shell">
      <div className="profile-page-grid">
        <aside className="profile-summary">
          <p className="profile-avatar-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="profile-avatar" src="/images/avatar.png" alt={user.displayName} />
          </p>
          <h2>{user.displayName}</h2>
          <p className="profile-email">{user.email}</p>
          {user.username !== user.displayName && <p className="profile-username">@{user.username}</p>}
          <p className="profile-stats">
            目前有 <em>{stats.publishedPosts}</em> 篇日志，并有 <em>{stats.comments}</em> 条关于你的评论，分布在 <em>{stats.categories}</em> 个分类中。
          </p>
          {user.lastLoginAt && <p className="profile-last-login">最后登录：{user.lastLoginAt.toLocaleString("zh-CN")}</p>}
        </aside>

        <div className="typecho-content-panel profile-form-panel" role="form">
          <AdminPageTitle title="个人设置" />
          <section>
            <ProfileDetailsForm displayName={user.displayName} url={user.url} email={user.email} />
          </section>

          <section id="writing-option" className="profile-section">
            <h3>撰写设置</h3>
            <ProfileWritingOptionsForm preferences={preferences} />
          </section>

          <section id="change-password" className="profile-section">
            <h3>密码修改</h3>
            <ProfilePasswordForm />
          </section>
        </div>
      </div>
    </div>
  );
}
