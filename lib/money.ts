export function parseMoney(input: string): number | null {
  let value = input.trim().toLowerCase().replace(/\s+/g, "");
  value = value.replace(/,/g, ".");

  if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    return Number(value.replace(/\./g, ""));
  }

  const trMatch = value.match(/^(\d+)(?:\.(\d+))?tr(\d+)?$/i);
  if (trMatch) {
    const whole = Number(trMatch[1]);
    const decimalDigits = trMatch[2];
    const suffixThousands = trMatch[3];
    if (decimalDigits) return Math.round(Number(`${whole}.${decimalDigits}`) * 1_000_000);
    if (suffixThousands) return whole * 1_000_000 + Number(suffixThousands) * 1_000;
    return whole * 1_000_000;
  }

  const kMatch = value.match(/^(\d+(?:\.\d+)?)k$/i);
  if (kMatch) return Math.round(Number(kMatch[1]) * 1_000);

  if (/^\d+$/.test(value)) return Number(value);
  return null;
}

export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
}

export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayName(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export type ParsedTransaction = { type: "deposit" | "ads"; amount: number; customerName: string };

export function parseTransaction(text: string): ParsedTransaction | null {
  const match = text.trim().match(/^([+-])\s*([^\s]+)\s+(.+)$/u);
  if (!match) return null;
  const amount = parseMoney(match[2]);
  const customerName = displayName(match[3]);
  if (!amount || amount <= 0 || !customerName) return null;
  return { type: match[1] === "+" ? "deposit" : "ads", amount, customerName };
}
