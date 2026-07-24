import { getConfig } from "@/lib/config";
import { formatVnd, parsePaymentMessage } from "@/lib/parse-money";
import { sendMessage, sendPhoto } from "@/lib/telegram";
import type { TelegramUpdate } from "@/lib/types";
import { buildVietQrUrl } from "@/lib/vietqr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const HELP_TEXT = [
  "CÁCH DÙNG BOT VIETQR",
  "",
  "Gửi: SỐ TIỀN | NỘI DUNG CK",
  "",
  "Ví dụ:",
  "4.2tr | CK",
  "4tr | THANH TOAN",
  "4000k | DON HANG 125",
  "4.200.000 | CK",
  "",
  "Không ghi nội dung thì bot dùng nội dung mặc định CK.",
  "Gửi /id để xem Telegram User ID của bạn.",
].join("\n");

export async function GET() {
  return Response.json({ ok: true, endpoint: "telegram-webhook" });
}

export async function POST(request: Request) {
  let config: ReturnType<typeof getConfig>;
  try {
    config = getConfig();
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, error: "Server chưa được cấu hình" }, { status: 500 });
  }

  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (receivedSecret !== config.webhookSecret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message ?? update.edited_message;
  if (!message?.text || !message.from) return Response.json({ ok: true });

  const text = message.text.trim();
  const chatId = message.chat.id;
  const userId = String(message.from.id);
  const replyToMessageId = message.message_id;

  try {
    if (text === "/id" || text.startsWith("/id@")) {
      await sendMessage({
        token: config.telegramBotToken,
        chatId,
        replyToMessageId,
        text: `Telegram User ID của bạn: ${userId}`,
      });
      return Response.json({ ok: true });
    }

    if (config.allowedUserIds.size > 0 && !config.allowedUserIds.has(userId)) {
      await sendMessage({
        token: config.telegramBotToken,
        chatId,
        replyToMessageId,
        text: "Bạn chưa được cấp quyền sử dụng bot. Gửi /id và thêm ID này vào ALLOWED_TELEGRAM_USER_IDS trên Vercel.",
      });
      return Response.json({ ok: true });
    }

    if (text === "/start" || text.startsWith("/start@") || text === "/help" || text.startsWith("/help@")) {
      await sendMessage({ token: config.telegramBotToken, chatId, text: HELP_TEXT, replyToMessageId });
      return Response.json({ ok: true });
    }

    const payment = parsePaymentMessage(text, config.defaultTransferContent);
    if (!payment) {
      await sendMessage({
        token: config.telegramBotToken,
        chatId,
        replyToMessageId,
        text: `Sai định dạng.\n\n${HELP_TEXT}`,
      });
      return Response.json({ ok: true });
    }

    const qrUrl = buildVietQrUrl({
      bankId: config.bankId,
      accountNo: config.bankAccountNo,
      accountName: config.bankAccountName,
      amount: payment.amount,
      content: payment.content,
    });

    const caption = [
      "THANH TOÁN CHUYỂN KHOẢN",
      "",
      `Số tiền: ${formatVnd(payment.amount)}`,
      `Ngân hàng: ${config.bankId}`,
      `Số tài khoản: ${config.bankAccountNo}`,
      `Chủ tài khoản: ${config.bankAccountName}`,
      `Nội dung: ${payment.content}`,
    ].join("\n");

    await sendPhoto({
      token: config.telegramBotToken,
      chatId,
      photoUrl: qrUrl,
      text: caption,
      replyToMessageId,
    });
  } catch (error) {
    console.error("Xử lý Telegram thất bại", error);
    try {
      await sendMessage({
        token: config.telegramBotToken,
        chatId,
        replyToMessageId,
        text: "Không tạo được QR. Hãy kiểm tra cấu hình ngân hàng hoặc thử lại.",
      });
    } catch (sendError) {
      console.error("Không gửi được thông báo lỗi", sendError);
    }
  }

  return Response.json({ ok: true });
}
