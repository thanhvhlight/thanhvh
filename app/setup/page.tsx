"use client";

import { useState } from "react";

export default function SetupPage() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState("Chưa kiểm tra.");
  const [loading, setLoading] = useState(false);

  async function run(path: string, method: "GET" | "POST") {
    setLoading(true);
    try {
      const response = await fetch(path, { method, headers: { "x-admin-key": key } });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally { setLoading(false); }
  }

  return (
    <main>
      <section className="hero">
        <span className="badge">SETUP</span>
        <h1>Kết nối Telegram</h1>
        <p>Nhập ADMIN_SETUP_KEY đã lưu trên Vercel. Khóa chỉ được gửi đến API của chính dự án.</p>
      </section>
      <section className="card" style={{ marginTop: 22 }}>
        <label htmlFor="key"><b>ADMIN_SETUP_KEY</b></label>
        <input id="key" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Nhập khóa quản trị" style={{ width:"100%", margin:"10px 0 14px", padding:13, border:"1px solid #cbd8e8", borderRadius:10, fontSize:16 }} />
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button disabled={loading || !key} onClick={() => run("/api/admin/setup-webhook", "POST")} style={buttonStyle}>Kết nối Telegram</button>
          <button disabled={loading || !key} onClick={() => run("/api/admin/status", "GET")} style={buttonStyle}>Kiểm tra trạng thái</button>
        </div>
        <pre className="cmd" style={{ minHeight:140, whiteSpace:"pre-wrap" }}>{loading ? "Đang xử lý..." : result}</pre>
      </section>
    </main>
  );
}

const buttonStyle: React.CSSProperties = { border:0, borderRadius:10, padding:"12px 18px", background:"#145fa7", color:"white", fontWeight:700, cursor:"pointer" };
