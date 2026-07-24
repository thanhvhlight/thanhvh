import "./utils/load-env.mjs";
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Thiếu TELEGRAM_BOT_TOKEN trong .env.local");
const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ drop_pending_updates: true })
});
console.log(JSON.stringify(await response.json(), null, 2));
