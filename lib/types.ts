export type TelegramUser = { id: number; first_name?: string; username?: string };
export type TelegramChat = { id: number; type: string };
export type TelegramMessage = { message_id: number; text?: string; caption?: string; photo?: unknown[]; chat: TelegramChat; from?: TelegramUser };
export type CallbackQuery = { id: string; from: TelegramUser; data?: string; message?: TelegramMessage };
export type TelegramUpdate = { update_id: number; message?: TelegramMessage; edited_message?: TelegramMessage; callback_query?: CallbackQuery };

export type Bank = {
  id: string;
  code: string;
  label: string;
  bank_id: string;
  account_no: string;
  account_name: string;
  is_default: boolean;
};
