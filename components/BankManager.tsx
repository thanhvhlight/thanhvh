"use client";

import { FormEvent, useState } from "react";

type Bank = { id: string; label: string; bank_id: string; account_no: string; account_name: string; is_default: boolean; is_active: boolean };

export default function BankManager() {
  const [key, setKey] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ label: "", bank_id: "", account_no: "", account_name: "" });

  async function load() {
    setMessage("Đang tải...");
    const response = await fetch("/api/admin/banks", { headers: { "x-admin-key": key } });
    const json = await response.json();
    if (!response.ok) return setMessage(json.message ?? "Không tải được dữ liệu");
    setBanks(json.banks); setMessage("Đã tải danh sách ngân hàng");
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/banks", {
      method: "POST", headers: { "content-type": "application/json", "x-admin-key": key }, body: JSON.stringify(form),
    });
    const json = await response.json();
    if (!response.ok) return setMessage(json.message ?? "Không thêm được ngân hàng");
    setForm({ label: "", bank_id: "", account_no: "", account_name: "" });
    setMessage("Đã thêm ngân hàng"); await load();
  }

  return <main className="admin-shell">
    <section className="admin-card">
      <span className="badge">V1.1 PRO</span>
      <h1>Quản lý ngân hàng nhận tiền</h1>
      <p>Thêm tài khoản tại đây, sau đó dùng <code>/bank</code> trên Telegram để chọn mặc định.</p>
      <label>Khóa quản trị</label>
      <div className="row"><input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_SETUP_KEY"/><button onClick={load}>Tải dữ liệu</button></div>
      {message && <p className="notice">{message}</p>}
      <form onSubmit={add} className="bank-form">
        <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Tên hiển thị, ví dụ TPBank"/>
        <input required value={form.bank_id} onChange={(e) => setForm({ ...form, bank_id: e.target.value })} placeholder="Mã VietQR, ví dụ TPB"/>
        <input required inputMode="numeric" value={form.account_no} onChange={(e) => setForm({ ...form, account_no: e.target.value })} placeholder="Số tài khoản"/>
        <input required value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Tên chủ tài khoản"/>
        <button type="submit">Thêm ngân hàng</button>
      </form>
      <div className="bank-list">{banks.map((bank) => <article key={bank.id}>
        <strong>{bank.is_default ? "✅ " : ""}{bank.label}</strong>
        <span>{bank.bank_id} · {bank.account_no}</span><span>{bank.account_name}</span>
      </article>)}</div>
    </section>
  </main>;
}
