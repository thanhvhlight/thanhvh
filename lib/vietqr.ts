import type { Bank } from "./types";

export function vietQrUrl(bank: Bank, amount: number): string {
  // qr_only: ảnh chỉ chứa mã QR, không tự chèn nội dung chuyển khoản.
  const params = new URLSearchParams({ amount: String(Math.round(amount)) });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bank_id)}-${encodeURIComponent(bank.account_no)}-qr_only.png?${params.toString()}`;
}
