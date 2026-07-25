import { updateSiteSettings } from "@/actions/settings";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { getSiteSettings } from "@/lib/repositories/settings";
import { Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  return (
    <section className="settings-page-column">
      <AdminPageTitle title="基本设置" />
      <div className="admin-option-wrap">
        <form action={updateSiteSettings}>
          <ul className="typecho-option">
            <li><label className="typecho-label">站点名称</label><input className="text" name="siteName" defaultValue={settings.siteName} required /><p className="description-text">站点的名称将显示在网页的标题处。</p></li>
            <li><label className="typecho-label">站点描述</label><textarea name="siteDescription" defaultValue={settings.siteDescription} /><p className="description-text">站点描述将显示在网页代码的头部。</p></li>
            <li><label className="typecho-label">每页文章数</label><input className="num" type="number" name="postsPerPage" min="1" max="50" defaultValue={settings.postsPerPage} /><p className="description-text">此数目用于限制首页、分类和标签归档每页显示的文章数量。</p></li>
            <li className="settings-toggle-option">
              <div className="settings-toggle-row">
                <label className="typecho-label" htmlFor="boxModel">紧凑/舒展模式</label>
                <label className="typecho-switch">
                  <input id="boxModel" name="boxModel" type="checkbox" defaultChecked={settings.boxModel} />
                  <span aria-hidden="true" />
                </label>
              </div>
              <p className="description-text">开启为紧凑模式，关闭为舒展模式。仅影响 Handsome 主题的页面密度。</p>
            </li>
          </ul>
          <ul className="typecho-option typecho-option-submit">
            <li>
              <button className="btn primary admin-action-button" type="submit">
                <Save aria-hidden="true" />
                保存设置
              </button>
            </li>
          </ul>
        </form>
      </div>
    </section>
  );
}
