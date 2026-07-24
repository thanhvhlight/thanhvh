import { requireAdmin, getAppUrl } from "@/lib/admin";
import { getMe, getWebhookInfo, setWebhook } from "@/lib/telegram-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    if (!admin.authorized) return Response.json({ ok: false, error: "Sai khóa quản trị" }, { status: 401 });

    const webhookUrl = `${getAppUrl(request)}/api/telegram`;
    const bot = await getMe(admin.config.telegramBotToken);
    await setWebhook(admin.config.telegramBotToken, webhookUrl, admin.config.webhookSecret);
    const webhook = await getWebhookInfo(admin.config.telegramBotToken);

    return Response.json({
      ok: true,
      message: "Đăng ký webhook thành công",
      bot: { name: bot.first_name, username: bot.username || null },
      webhook,
      webhook_url: webhookUrl,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Không thể đăng ký webhook" }, { status: 500 });
  }
}
