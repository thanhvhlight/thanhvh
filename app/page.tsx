"use client";

import { FormEvent, useMemo, useState } from "react";

const BANKS = [
  { code: "MB", name: "MB Bank" },
  { code: "VCB", name: "Vietcombank" },
  { code: "BIDV", name: "BIDV" },
  { code: "ICB", name: "VietinBank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "ACB" },
  { code: "VPB", name: "VPBank" },
  { code: "TPB", name: "TPBank" },
  { code: "STB", name: "Sacombank" },
  { code: "VIB", name: "VIB" },
  { code: "MSB", name: "MSB" },
  { code: "SHB", name: "SHB" },
  { code: "OCB", name: "OCB" },
  { code: "LPB", name: "LPBank" },
  { code: "EIB", name: "Eximbank" },
  { code: "NAB", name: "Nam A Bank" },
  { code: "BAB", name: "Bac A Bank" },
  { code: "SEAB", name: "SeABank" },
  { code: "ABB", name: "ABBank" },
  { code: "PVCB", name: "PVcomBank" }
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatMoney(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

export default function HomePage() {
  const [bank, setBank] = useState("MB");
  const [account, setAccount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("THANH TOAN");
  const [showQR, setShowQR] = useState(false);

  const qrUrl = useMemo(() => {
    if (!account.trim()) return "";

    const params = new URLSearchParams();
    if (amount) params.set("amount", onlyDigits(amount));
    if (description.trim()) params.set("addInfo", description.trim());
    if (accountName.trim()) params.set("accountName", accountName.trim());

    return `https://img.vietqr.io/image/${bank}-${account.trim()}-compact2.png?${params.toString()}`;
  }, [bank, account, accountName, amount, description]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowQR(true);
  }

  return (
    <main className="page-shell">
      <section className="card form-card no-print">
        <div className="heading-wrap">
          <span className="eyebrow">VIETQR NHANH</span>
          <h1>Tạo mã QR chuyển khoản</h1>
          <p>Chỉnh sửa tài khoản, nhập số tiền và in QR chỉ trong vài giây.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            <span>Ngân hàng</span>
            <select value={bank} onChange={(e) => setBank(e.target.value)}>
              {BANKS.map((item) => (
                <option key={item.code} value={item.code}>{item.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Số tài khoản</span>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\s/g, ""))}
              placeholder="Nhập số tài khoản"
              inputMode="numeric"
              required
            />
          </label>

          <label>
            <span>Tên chủ tài khoản</span>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
            />
          </label>

          <label>
            <span>Số tiền</span>
            <div className="money-input">
              <input
                value={formatMoney(amount)}
                onChange={(e) => {
                  setAmount(onlyDigits(e.target.value));
                  setShowQR(false);
                }}
                placeholder="0"
                inputMode="numeric"
              />
              <b>đ</b>
            </div>
          </label>

          <label className="full-width">
            <span>Nội dung chuyển khoản</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: THANH TOAN DON HANG"
              maxLength={50}
            />
          </label>

          <button type="submit" className="primary-button">Tạo mã QR</button>
        </form>
      </section>

      {showQR && qrUrl && (
        <section className="card qr-card" id="print-area">
          <div className="qr-header">
            <span className="eyebrow">QUÉT ĐỂ THANH TOÁN</span>
            <h2>Thông tin chuyển khoản</h2>
          </div>

          {/* VietQR returns a ready-to-scan PNG image */}
          <img src={qrUrl} alt="Mã QR chuyển khoản ngân hàng" className="qr-image" />

          <div className="payment-info">
            <div><span>Ngân hàng</span><strong>{BANKS.find((item) => item.code === bank)?.name}</strong></div>
            <div><span>Số tài khoản</span><strong>{account}</strong></div>
            {accountName && <div><span>Chủ tài khoản</span><strong>{accountName}</strong></div>}
            {amount && <div><span>Số tiền</span><strong>{Number(amount).toLocaleString("vi-VN")}đ</strong></div>}
            {description && <div><span>Nội dung</span><strong>{description}</strong></div>}
          </div>

          <div className="action-row no-print">
            <button onClick={() => window.print()} className="secondary-button">In QR</button>
            <a href={qrUrl} target="_blank" rel="noreferrer" className="secondary-button">Mở ảnh QR</a>
          </div>
        </section>
      )}
    </main>
  );
}
