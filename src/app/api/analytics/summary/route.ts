import { getCurrentUser } from "@/lib/auth/session";
import { getTrafficStatsSnapshot } from "@/lib/traffic-stats-snapshot-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "需要登录后查看访问统计" }, { status: 401 });
  }
  if (user.role !== "administrator") {
    return Response.json({ error: "无权查看访问统计" }, { status: 403 });
  }

  const snapshot = getTrafficStatsSnapshot();
  if (!snapshot) {
    return Response.json(
      { error: "访问统计快照尚未就绪" },
      {
        status: 503,
        headers: { "Retry-After": "2" },
      },
    );
  }

  return Response.json(snapshot.value, {
    headers: {
      "Cache-Control": "no-store",
      "X-Stats-Snapshot-At": String(snapshot.updatedAt),
    },
  });
}
