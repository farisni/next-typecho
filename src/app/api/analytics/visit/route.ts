import { enqueueTrafficVisit } from "@/lib/analytics/traffic";

export const runtime = "nodejs";

const BOT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|headless|lighthouse|monitoring|uptime/i;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2048 || BOT_PATTERN.test(request.headers.get("user-agent") ?? "")) {
    return new Response(null, { status: 204 });
  }

  try {
    const body = (await request.json()) as {
      path?: unknown;
      visitorId?: unknown;
    };
    if (typeof body.path === "string" && typeof body.visitorId === "string") {
      enqueueTrafficVisit(body.path, body.visitorId);
    }
  } catch {
    // 统计失败不应影响访问，也不向客户端暴露错误细节。
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
