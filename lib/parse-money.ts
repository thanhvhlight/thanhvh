export interface ParsedPayment {
  amount: number;
  content: string;
}

const MAX_AMOUNT = 999_999_999_999;

function normalizeDecimal(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

export function parseMoney(input: string): number | null {
  const value = normalizeDecimal(input);
  if (!value) return null;

  const suffixMatch = value.match(/^([0-9]+(?:[.,][0-9]+)?)(tr|triệu|trieu|m|k)$/i);
  if (suffixMatch) {
    const numeric = Number(suffixMatch[1].replace(",", "."));
    const suffix = suffixMatch[2].toLowerCase();
    const multiplier = suffix === "k" ? 1_000 : 1_000_000;
    const amount = Math.round(numeric * multiplier);
    return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_AMOUNT ? amount : null;
  }

  // Không có hậu tố: chấp nhận 4200000, 4.200.000 hoặc 4,200,000.
  if (!/^[0-9][0-9.,]*$/.test(value)) return null;
  const digits = value.replace(/[.,]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_AMOUNT ? amount : null;
}

export function parsePaymentMessage(text: string, defaultContent: string): ParsedPayment | null {
  const [moneyPart, ...contentParts] = text.split("|");
  const amount = parseMoney(moneyPart);
  if (!amount) return null;

  const content = contentParts.join("|").trim() || defaultContent;
  return { amount, content: content.slice(0, 100) };
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}
