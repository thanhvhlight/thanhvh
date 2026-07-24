import "./utils/load-env.mjs";
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Thiếu TELEGRAM_BOT_TOKEN trong .env.local");
const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
console.log(JSON.stringify(await response.json(), null, 2));
