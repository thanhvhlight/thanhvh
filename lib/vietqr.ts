import type { Bank } from "./types";

export function vietQrUrl(bank: Bank, amount: number): string {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    accountName: bank.account_name,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bank_id)}-${encodeURIComponent(bank.account_no)}-compact2.png?${params.toString()}`;
}
