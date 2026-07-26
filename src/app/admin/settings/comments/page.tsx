import { Save } from "lucide-react";
import { updateCommentSettings } from "@/actions/settings";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { getCommentSettings } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

export default function CommentSettingsPage() {
  const settings = getCommentSettings();
  return (
    <section className="settings-page-column">
      <AdminPageTitle title="评论设置" />
      <div className="admin-option-wrap">
        <form action={updateCommentSettings}>
          <ul className="typecho-option">
            <li>
              <label className="typecho-label">评论显示</label>
              <p><label><input name="commentsMarkdown" type="checkbox" defaultChecked={settings.commentsMarkdown} /> 在评论中使用 Markdown</label></p>
              <p><label><input name="commentsShowUrl" type="checkbox" defaultChecked={settings.commentsShowUrl} /> 评论者称呼链接到个人主页</label></p>
              <p><label><input name="commentsUrlNofollow" type="checkbox" defaultChecked={settings.commentsUrlNofollow} /> 个人主页链接添加 nofollow</label></p>
              <p><label><input name="commentsAvatar" type="checkbox" defaultChecked={settings.commentsAvatar} /> 显示 Gravatar 头像</label></p>
            </li>
            <li>
              <label className="typecho-label">分页与顺序</label>
              <p>每页显示 <input className="num" name="commentsPerPage" type="number" min={1} max={100} defaultValue={settings.commentsPerPage} /> 条顶级评论</p>
              <p>
                <select name="commentsOrder" defaultValue={settings.commentsOrder}>
                  <option value="ASC">较旧的评论在前</option>
                  <option value="DESC">较新的评论在前</option>
                </select>
                {" "}
                <select name="commentsDefaultPage" defaultValue={settings.commentsDefaultPage}>
                  <option value="first">默认显示第一页</option>
                  <option value="last">默认显示最后一页</option>
                </select>
              </p>
            </li>
            <li>
              <label className="typecho-label">评论回复</label>
              <p><label><input name="commentsThreaded" type="checkbox" defaultChecked={settings.commentsThreaded} /> 启用 YouTube 式两层回复</label></p>
              <input name="commentsMaxNestingLevels" type="hidden" value="2" />
              <p className="description-text">所有回复归入顶级评论线程，回复其他回复时显示 @回复对象。</p>
            </li>
            <li>
              <label className="typecho-label">提交与审核</label>
              <p><label><input name="commentsRequireModeration" type="checkbox" defaultChecked={settings.commentsRequireModeration} /> 所有评论必须经过审核</label></p>
              <p><label><input name="commentsWhitelist" type="checkbox" defaultChecked={settings.commentsWhitelist} /> 评论者之前须有评论通过审核</label></p>
              <p><label><input name="commentsRequireMail" type="checkbox" defaultChecked={settings.commentsRequireMail} /> 必须填写邮箱</label></p>
              <p><label><input name="commentsRequireUrl" type="checkbox" defaultChecked={settings.commentsRequireUrl} /> 必须填写网址</label></p>
              <p><label><input name="commentsCheckReferer" type="checkbox" defaultChecked={settings.commentsCheckReferer} /> 检查评论来源页</label></p>
              <p><label><input name="commentsAntiSpam" type="checkbox" defaultChecked={settings.commentsAntiSpam} /> 开启反垃圾保护</label></p>
            </li>
            <li>
              <label className="typecho-label">限制</label>
              <p>同一 IP 评论间隔 <input className="num" name="commentsPostInterval" type="number" min={0} max={86400} defaultValue={settings.commentsPostInterval} /> 秒，填 0 关闭</p>
              <p>文章发布 <input className="num" name="commentsAutoCloseDays" type="number" min={0} max={36500} defaultValue={settings.commentsAutoCloseDays} /> 天后关闭评论，填 0 关闭</p>
            </li>
          </ul>
          <ul className="typecho-option typecho-option-submit">
            <li><button className="btn primary admin-action-button" type="submit"><Save aria-hidden="true" />保存设置</button></li>
          </ul>
        </form>
      </div>
    </section>
  );
}
