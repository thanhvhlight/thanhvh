function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

export const config = {
  get telegramToken() { return env("TELEGRAM_BOT_TOKEN"); },
  get webhookSecret() { return env("TELEGRAM_WEBHOOK_SECRET"); },
  get supabaseUrl() { return env("SUPABASE_URL"); },
  get supabaseServiceRoleKey() { return env("SUPABASE_SERVICE_ROLE_KEY"); },
  get appUrl() { return env("APP_URL").replace(/\/$/, ""); },
  get adminSetupKey() { return env("ADMIN_SETUP_KEY"); },
  get defaultFeePercent() { return Number(process.env.DEFAULT_FEE_PERCENT || "12"); },
  get timezone() { return process.env.TIMEZONE || "Asia/Ho_Chi_Minh"; },
  get allowedUserIds() {
    return (process.env.ALLOWED_TELEGRAM_USER_IDS || "")
      .split(",").map((x) => x.trim()).filter(Boolean).map(Number).filter(Number.isFinite);
  },
};
