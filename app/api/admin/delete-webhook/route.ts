import { requireAdmin } from "@/lib/admin";
import { deleteWebhook, getWebhookInfo } from "@/lib/telegram-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    if (!admin.authorized) return Response.json({ ok: false, error: "Sai khóa quản trị" }, { status: 401 });
    await deleteWebhook(admin.config.telegramBotToken);
    const webhook = await getWebhookInfo(admin.config.telegramBotToken);
    return Response.json({ ok: true, message: "Đã ngắt webhook", webhook });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Không thể ngắt webhook" }, { status: 500 });
  }
}
