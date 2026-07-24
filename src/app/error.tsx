"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">暂时无法加载页面</h1>
        <p className="mt-3 text-slate-600">请稍后重试；开发环境可查看终端中的具体错误。</p>
        <button className="button-primary mt-6" onClick={reset}>重新加载</button>
      </div>
    </main>
  );
}
