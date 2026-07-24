interface SendMessageParams {
  token: string;
  chatId: number;
  text: string;
  replyToMessageId?: number;
}

interface SendPhotoParams extends SendMessageParams {
  photoUrl: string;
}

async function telegramRequest(token: string, method: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} lỗi: ${JSON.stringify(data)}`);
  }
  return data;
}

export function sendMessage(params: SendMessageParams) {
  return telegramRequest(params.token, "sendMessage", {
    chat_id: params.chatId,
    text: params.text,
    reply_parameters: params.replyToMessageId
      ? { message_id: params.replyToMessageId }
      : undefined,
  });
}

export function sendPhoto(params: SendPhotoParams) {
  return telegramRequest(params.token, "sendPhoto", {
    chat_id: params.chatId,
    photo: params.photoUrl,
    caption: params.text,
    reply_parameters: params.replyToMessageId
      ? { message_id: params.replyToMessageId }
      : undefined,
  });
}
