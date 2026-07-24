import { config } from "./config";

const base = () => `https://api.telegram.org/bot${config.telegramToken}`;

async function call(method: string, body: Record<string, unknown>) {
  const response = await fetch(`${base()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(`Telegram ${method}: ${JSON.stringify(data)}`);
  return data.result;
}

export const telegram = {
  sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
    return call("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", reply_markup: replyMarkup });
  },
  sendPhoto(chatId: number, photo: string, caption?: string, replyMarkup?: unknown) {
    return call("sendPhoto", { chat_id: chatId, photo, ...(caption ? { caption, parse_mode: "HTML" } : {}), reply_markup: replyMarkup });
  },
  editMessageCaption(chatId: number, messageId: number, caption: string, replyMarkup?: unknown) {
    return call("editMessageCaption", { chat_id: chatId, message_id: messageId, caption, parse_mode: "HTML", reply_markup: replyMarkup });
  },
  editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: unknown) {
    return call("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", reply_markup: replyMarkup });
  },
  editMessageMedia(chatId: number, messageId: number, photo: string, caption?: string, replyMarkup?: unknown) {
    return call("editMessageMedia", { chat_id: chatId, message_id: messageId, media: { type: "photo", media: photo, ...(caption ? { caption, parse_mode: "HTML" } : {}) }, reply_markup: replyMarkup });
  },
  answerCallbackQuery(id: string, text?: string, showAlert = false) {
    return call("answerCallbackQuery", { callback_query_id: id, text, show_alert: showAlert });
  },
  setWebhook(url: string) {
    return call("setWebhook", {
      url,
      secret_token: config.webhookSecret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
  },
  getWebhookInfo() { return call("getWebhookInfo", {}); },
  getMe() { return call("getMe", {}); },
};
