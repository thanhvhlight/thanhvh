import "./utils/load-env.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = process.env.APP_URL?.replace(/\/$/, "");
if (!token || !secret || !appUrl) {
  throw new Error("Thiếu TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET hoặc APP_URL trong .env.local");
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${appUrl}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "edited_message"],
    drop_pending_updates: true
  })
});
console.log(JSON.stringify(await response.json(), null, 2));
