import { getTrafficSummary } from "@/lib/analytics/traffic";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "需要登录后查看访问统计" }, { status: 401 });
  }
  if (user.role !== "administrator") {
    return Response.json({ error: "无权查看访问统计" }, { status: 403 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? 365);
  return Response.json(getTrafficSummary(Number.isFinite(days) ? days : 365), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
