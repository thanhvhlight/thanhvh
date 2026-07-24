"use client";

import { FormEvent, useState } from "react";

type Bank = { id: string; label: string; bank_id: string; account_no: string; account_name: string; is_default: boolean; is_active: boolean };
type FormState = { label: string; bank_id: string; account_no: string; account_name: string };
const emptyForm: FormState = { label: "", bank_id: "", account_no: "", account_name: "" };

export default function BankManager() {
  const [key, setKey] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const headers = { "content-type": "application/json", "x-admin-key": key };

  async function load() {
    setMessage("Đang tải...");
    const response = await fetch("/api/admin/banks", { headers: { "x-admin-key": key }, cache: "no-store" });
    const json = await response.json();
    if (!response.ok) return setMessage(json.message ?? "Không tải được dữ liệu");
    setBanks(json.banks); setMessage("Đã tải danh sách ngân hàng");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/banks", {
      method: editingId ? "PATCH" : "POST", headers, body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });
    const json = await response.json();
    if (!response.ok) return setMessage(json.message ?? "Không lưu được ngân hàng");
    setForm(emptyForm); setEditingId(null); setMessage(editingId ? "Đã cập nhật ngân hàng" : "Đã thêm ngân hàng"); await load();
  }

  function edit(bank: Bank) {
    setEditingId(bank.id);
    setForm({ label: bank.label, bank_id: bank.bank_id, account_no: bank.account_no, account_name: bank.account_name });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateBank(id: string, changes: Record<string, unknown>) {
    const response = await fetch("/api/admin/banks", { method: "PATCH", headers, body: JSON.stringify({ id, ...changes }) });
    const json = await response.json();
    if (!response.ok) return setMessage(json.message ?? "Không cập nhật được ngân hàng");
    setMessage("Đã cập nhật ngân hàng"); await load();
  }

  async function remove(bank: Bank) {
    if (!window.confirm(`Xóa tài khoản ${bank.label} • ${bank.account_no}?`)) return;
    const response = await fetch(`/api/admin/banks?id=${encodeURIComponent(bank.id)}`, { method: "DELETE", headers: { "x-admin-key": key } });
    const json = await response.json();
    if (!response.ok) return setMessage(json.message ?? "Không xóa được ngân hàng");
    setMessage("Đã xóa ngân hàng"); await load();
  }

  return <main className="admin-shell">
    <section className="admin-card">
      <span className="badge">V1.3 PRO</span>
      <h1>Quản lý ngân hàng nhận tiền</h1>
      <p>Thêm, sửa, xóa và chọn tài khoản mặc định. QR mới sẽ dùng tài khoản đang mặc định.</p>
      <label>Khóa quản trị</label>
      <div className="row"><input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_SETUP_KEY"/><button onClick={load}>Tải dữ liệu</button></div>
      {message && <p className="notice">{message}</p>}
      <form onSubmit={save} className="bank-form">
        <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Tên hiển thị, ví dụ TPBank"/>
        <input required value={form.bank_id} onChange={(e) => setForm({ ...form, bank_id: e.target.value })} placeholder="Mã VietQR, ví dụ TPB"/>
        <input required inputMode="numeric" value={form.account_no} onChange={(e) => setForm({ ...form, account_no: e.target.value })} placeholder="Số tài khoản"/>
        <input required value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Tên chủ tài khoản"/>
        <button type="submit">{editingId ? "Lưu thay đổi" : "Thêm ngân hàng"}</button>
        {editingId && <button type="button" className="muted" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy sửa</button>}
      </form>
      <div className="bank-list">{banks.map((bank) => <article key={bank.id}>
        <div><strong>{bank.is_default ? "✅ " : ""}{bank.label}</strong><span>{bank.bank_id} · {bank.account_no}</span><span>{bank.account_name}</span></div>
        <div className="bank-actions">
          {!bank.is_default && <button onClick={() => void updateBank(bank.id, { is_default: true })}>Đặt mặc định</button>}
          <button className="muted" onClick={() => edit(bank)}>Sửa</button>
          <button className="danger" onClick={() => void remove(bank)}>Xóa</button>
        </div>
      </article>)}</div>
      <p><a href="/">← Về Dashboard</a></p>
    </section>
  </main>;
}
