type TelegramResult<T> = { ok: boolean; result?: T; description?: string };

async function telegramAdminRequest<T>(token: string, method: string, payload?: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });

  const data = (await response.json()) as TelegramResult<T>;
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram ${method} thất bại`);
  }
  return data.result as T;
}

export type BotInfo = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

export type WebhookInfo = {
  url: string;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  ip_address?: string;
};

export const getMe = (token: string) => telegramAdminRequest<BotInfo>(token, "getMe");
export const getWebhookInfo = (token: string) => telegramAdminRequest<WebhookInfo>(token, "getWebhookInfo");

export const setWebhook = (token: string, url: string, secretToken: string) =>
  telegramAdminRequest<boolean>(token, "setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: false,
  });

export const deleteWebhook = (token: string) =>
  telegramAdminRequest<boolean>(token, "deleteWebhook", { drop_pending_updates: false });
