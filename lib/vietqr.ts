interface VietQrParams {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
}

export function buildVietQrUrl(params: VietQrParams): string {
  const bank = encodeURIComponent(params.bankId.trim());
  const account = encodeURIComponent(params.accountNo.trim());
  const query = new URLSearchParams({
    amount: String(params.amount),
    addInfo: params.content,
    accountName: params.accountName,
  });
  return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?${query.toString()}`;
}
