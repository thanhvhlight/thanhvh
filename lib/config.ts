function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

export function getConfig() {
  return {
    telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
    webhookSecret: required("TELEGRAM_WEBHOOK_SECRET"),
    bankId: required("BANK_ID"),
    bankAccountNo: required("BANK_ACCOUNT_NO"),
    bankAccountName: required("BANK_ACCOUNT_NAME"),
    defaultTransferContent: process.env.DEFAULT_TRANSFER_CONTENT?.trim() || "CK",
    allowedUserIds: new Set(
      (process.env.ALLOWED_TELEGRAM_USER_IDS || "")
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    ),
  };
}
