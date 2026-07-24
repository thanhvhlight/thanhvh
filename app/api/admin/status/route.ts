import { requireAdmin, getAppUrl } from "@/lib/admin";
import { getMe, getWebhookInfo } from "@/lib/telegram-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    if (!admin.authorized) return Response.json({ ok: false, error: "Sai khóa quản trị" }, { status: 401 });

    const [bot, webhook] = await Promise.all([
      getMe(admin.config.telegramBotToken),
      getWebhookInfo(admin.config.telegramBotToken),
    ]);

    const expectedUrl = `${getAppUrl(request)}/api/telegram`;
    return Response.json({
      ok: true,
      bot: { id: bot.id, name: bot.first_name, username: bot.username || null },
      webhook: {
        ...webhook,
        expected_url: expectedUrl,
        connected: webhook.url === expectedUrl,
      },
      bank: {
        id: admin.config.bankId,
        account_no_masked: admin.config.bankAccountNo.replace(/.(?=.{4})/g, "•"),
        account_name: admin.config.bankAccountName,
        default_content: admin.config.defaultTransferContent,
        allowed_users: admin.config.allowedUserIds.size,
      },
    });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Lỗi hệ thống" }, { status: 500 });
  }
}
