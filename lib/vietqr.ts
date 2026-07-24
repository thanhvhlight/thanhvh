import type { Bank } from "./types";

export function vietQrUrl(bank: Bank, amount: number, customerName: string): string {
  const info = `${customerName} CK`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: info,
    accountName: bank.account_name,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bank_id)}-${encodeURIComponent(bank.account_no)}-compact2.png?${params.toString()}`;
}
