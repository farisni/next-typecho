import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdministratorInstallForm } from "@/components/install/administrator-install-form";
import {
  DatabaseInitializeForm,
  EnvironmentContinueForm,
} from "@/components/install/install-step-forms";
import {
  checkInstallEnvironment,
  inspectInstallationState,
} from "@/lib/bootstrap/install-state";
import { getDatabasePath } from "@/lib/bootstrap/migrations";

export const metadata: Metadata = { title: "Typecho 安装程序" };
export const dynamic = "force-dynamic";

function StepTitle({ children }: { children: React.ReactNode }) {
  return <div className="typecho-page-title"><h2>{children}</h2></div>;
}

function WelcomeStep() {
  const checks = checkInstallEnvironment();
  const ready = checks.every(({ ok }) => ok);

  return (
    <>
      <StepTitle>欢迎使用 Typecho</StepTitle>
      <div id="typecho-welcome">
        <h3>安装说明</h3>
        <p className="warning"><strong>本安装程序将自动检测服务器环境是否符合最低配置需求. 如果不符合, 将在下方出现提示信息, 请按照提示信息检查您的运行环境. 如果服务器环境符合要求, 点击按钮即可继续安装.</strong></p>
        <ul className="environment-checks">
          {checks.map((check) => (
            <li className={check.ok ? "check-ok" : "check-error"} key={check.label}>
              <strong>{check.label}</strong><span>{check.description}</span>
            </li>
          ))}
        </ul>
        <h3>许可及协议</h3>
        <ul>
          <li>Typecho 基于 <a href="https://www.gnu.org/copyleft/gpl.html">GPL</a> 协议发布, 允许在 GPL 协议许可的范围内使用、拷贝、修改和分发此程序.</li>
          <li>Next Typecho 使用 Next.js 重新实现核心体验, 安装程序会在本机 SQLite 中创建站点数据与首个管理员.</li>
        </ul>
        <EnvironmentContinueForm disabled={!ready} />
      </div>
    </>
  );
}

function DatabaseStep({ hasExistingData }: { hasExistingData: boolean }) {
  return (
    <>
      <StepTitle>初始化配置</StepTitle>
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="dbAdapter">数据库适配器</label>
          <select id="dbAdapter" defaultValue="sqlite" disabled><option value="sqlite">Node.js 内置 SQLite 适配器</option></select>
          <p className="description-text">当前版本使用 Node.js 内置 SQLite，无需安装额外数据库驱动</p>
        </li>
      </ul>
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="dbFile">数据库文件路径</label>
          <input id="dbFile" type="text" className="text" value={getDatabasePath()} readOnly />
          <p className="description-text">这是程序根据 DATABASE_URL 自动匹配的数据库地址</p>
        </li>
      </ul>
      {hasExistingData && <div className="message error fade">安装程序检查到原有数据已经存在.</div>}
      <DatabaseInitializeForm hasExistingData={hasExistingData} />
    </>
  );
}

async function getDefaultSiteUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function InstallPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const state = inspectInstallationState();
  if (state.status === "installed") redirect("/");

  const requestedStep = (await searchParams).step;
  const step = requestedStep === "2" || requestedStep === "3" ? requestedStep : "1";
  if (step === "3" && state.status === "needs-schema") redirect("/install?step=2");

  return (
    <main className="typecho-admin typecho-install-page">
      <div className="typecho-install-container">
        <h1><a href="https://typecho.org" className="i-logo">Typecho</a></h1>
        <div className="typecho-install-content">
          {step === "1" && <WelcomeStep />}
          {step === "2" && <DatabaseStep hasExistingData={state.hasExistingData} />}
          {step === "3" && (
            <>
              <StepTitle>创建您的管理员帐号</StepTitle>
              <AdministratorInstallForm defaultSiteUrl={await getDefaultSiteUrl()} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}