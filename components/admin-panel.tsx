"use client";

import { useState } from "react";

type ApiResult = Record<string, unknown> & { ok?: boolean; error?: string; message?: string };

export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);

  async function call(path: string, action: string) {
    if (!adminKey.trim()) {
      setResult({ ok: false, error: "Hãy nhập khóa quản trị ADMIN_SETUP_KEY" });
      return;
    }
    setLoading(action);
    setResult(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "x-admin-key": adminKey.trim() },
      });
      const data = (await response.json()) as ApiResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Không kết nối được máy chủ" });
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="admin-card">
      <div className="eyebrow">BẢN PRO · KHÔNG CẦN TERMINAL</div>
      <h1>Telegram VietQR Bot</h1>
      <p className="lead">Cấu hình biến môi trường trên Vercel một lần, sau đó dùng trang này để kết nối và kiểm tra webhook Telegram.</p>

      <label htmlFor="adminKey">Khóa quản trị</label>
      <input
        id="adminKey"
        type="password"
        value={adminKey}
        onChange={(event) => setAdminKey(event.target.value)}
        placeholder="Nhập ADMIN_SETUP_KEY"
        autoComplete="current-password"
      />

      <div className="actions">
        <button onClick={() => call("/api/admin/setup", "setup")} disabled={Boolean(loading)}>
          {loading === "setup" ? "Đang kết nối…" : "Kết nối Telegram"}
        </button>
        <button className="secondary" onClick={() => call("/api/admin/status", "status")} disabled={Boolean(loading)}>
          {loading === "status" ? "Đang kiểm tra…" : "Kiểm tra trạng thái"}
        </button>
        <button className="danger" onClick={() => call("/api/admin/delete-webhook", "delete")} disabled={Boolean(loading)}>
          {loading === "delete" ? "Đang ngắt…" : "Ngắt webhook"}
        </button>
      </div>

      {result && (
        <div className={result.ok ? "result success" : "result error"}>
          <strong>{result.ok ? result.message || "Hoạt động bình thường" : result.error || "Có lỗi xảy ra"}</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="usage">
        <span>Cú pháp Telegram</span>
        <code>4.2tr | CK DON HANG 125</code>
      </div>
    </section>
  );
}
