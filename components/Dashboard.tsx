"use client";

import { FormEvent, useMemo, useState } from "react";

type DailyRow = { date: string; label: string; deposits: number; ads: number; fees: number; net: number; balance: number };
type DashboardData = {
  range: { from: string; to: string };
  totals: { deposits: number; ads: number; fees: number; net: number; totalBalance: number; customerCount: number };
  daily: DailyRow[];
  customers: Array<{ id: string; name: string; deposits: number; ads: number; fees: number; balance: number; feePercent: number }>;
  recent: Array<{ id: string; type: "deposit" | "ads" | "reversal"; amount: number; fee: number; totalEffect: number; createdAt: string; date: string; customer: string }>;
  management: Array<{ id: string; kind: "transaction" | "pending"; type: "deposit" | "ads" | "reversal"; status: string; amount: number; fee: number; totalEffect: number; createdAt: string; customer: string; locked: boolean }>;
  bank: { label: string; account_no: string; account_name: string } | null;
  activePeriod: { period_key: string } | null;
};

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function vietnamToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
function shiftDate(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  return dateKey(new Date(year, month - 1, day + days));
}
function monthStart(key: string) { return `${key.slice(0, 7)}-01`; }
function formatTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

function BarChart({ rows }: { rows: DailyRow[] }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.deposits, row.ads]));
  return <div className="native-chart" role="img" aria-label="Biểu đồ nạp và Ads theo ngày">
    <div className="chart-legend"><span><i className="legend-deposit"/>Nạp</span><span><i className="legend-ads"/>Ads</span></div>
    <div className="bar-chart-scroll"><div className="bar-chart" style={{ minWidth: `${Math.max(520, rows.length * 64)}px` }}>
      {rows.map((row) => <div className="bar-group" key={row.date} title={`${row.label}: Nạp ${money.format(row.deposits)}, Ads ${money.format(row.ads)}`}>
        <div className="bar-values"><span>{row.deposits ? compact.format(row.deposits) : ""}</span><span>{row.ads ? compact.format(row.ads) : ""}</span></div>
        <div className="bars"><i className="bar deposit" style={{ height: `${Math.max(row.deposits ? 4 : 0, row.deposits / max * 220)}px` }}/><i className="bar ads" style={{ height: `${Math.max(row.ads ? 4 : 0, row.ads / max * 220)}px` }}/></div>
        <b>{row.label}</b>
      </div>)}
    </div></div>
  </div>;
}

function BalanceLineChart({ rows }: { rows: DailyRow[] }) {
  const width = Math.max(640, rows.length * 72);
  const height = 280;
  const padding = 34;
  const values = rows.map((row) => row.balance);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = max - min || 1;
  const point = (value: number, index: number) => ({
    x: rows.length <= 1 ? width / 2 : padding + index * ((width - padding * 2) / (rows.length - 1)),
    y: padding + (max - value) / range * (height - padding * 2),
  });
  const points = rows.map((row, index) => point(row.balance, index));
  const path = points.map((item, index) => `${index ? "L" : "M"}${item.x},${item.y}`).join(" ");
  return <div className="line-chart-scroll"><svg className="line-chart" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: `${width}px` }} role="img" aria-label="Biểu đồ tổng số dư khách theo ngày">
    {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1={padding} x2={width - padding} y1={padding + ratio * (height - padding * 2)} y2={padding + ratio * (height - padding * 2)} className="grid-line" />)}
    <path d={path} className="balance-path" />
    {points.map((item, index) => <g key={rows[index].date}><circle cx={item.x} cy={item.y} r="5" className="balance-point"><title>{`${rows[index].label}: ${money.format(rows[index].balance)}`}</title></circle><text x={item.x} y={height - 8} textAnchor="middle" className="axis-label">{rows[index].label}</text></g>)}
  </svg></div>;
}

export default function Dashboard() {
  const today = vietnamToday();
  const [adminKey, setAdminKey] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Nhập khóa quản trị để xem dữ liệu.");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [savingFeeId, setSavingFeeId] = useState<string | null>(null);
  const [feeDrafts, setFeeDrafts] = useState<Record<string, string>>({});

  async function load(nextFrom = from, nextTo = to) {
    if (!adminKey.trim()) return setMessage("Hãy nhập ADMIN_SETUP_KEY.");
    setLoading(true); setMessage("Đang tải dữ liệu...");
    try {
      const response = await fetch(`/api/admin/dashboard?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}`, { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Không tải được dữ liệu");
      setData(json); setMessage(`Đã cập nhật ${nextFrom.split("-").reverse().join("/")} – ${nextTo.split("-").reverse().join("/")}.`);
    } catch (error) { setData(null); setMessage(error instanceof Error ? error.message : "Lỗi không xác định"); }
    finally { setLoading(false); }
  }
  function chooseRange(kind: "today" | "yesterday" | "7days" | "month") {
    let nextFrom = today, nextTo = today;
    if (kind === "yesterday") nextFrom = nextTo = shiftDate(today, -1);
    if (kind === "7days") nextFrom = shiftDate(today, -6);
    if (kind === "month") nextFrom = monthStart(today);
    setFrom(nextFrom); setTo(nextTo); void load(nextFrom, nextTo);
  }
  function submit(event: FormEvent) { event.preventDefault(); void load(); }

  async function saveCustomerFee(customer: DashboardData["customers"][number], explicitValue?: number) {
    const raw = explicitValue ?? Number(feeDrafts[customer.id] ?? customer.feePercent);
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      setMessage("Phí phải nằm trong khoảng 0–100%.");
      return;
    }
    setSavingFeeId(customer.id);
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ fee_percent: raw }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Không lưu được mức phí");
      setFeeDrafts((current) => ({ ...current, [customer.id]: String(raw) }));
      setMessage(`Đã đặt phí ${raw}% cho ${customer.name}. Giao dịch mới sẽ dùng mức phí này.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lỗi không xác định");
    } finally {
      setSavingFeeId(null);
    }
  }

  async function approveItem(item: DashboardData["management"][number]) {
    if (item.kind !== "pending" || item.status !== "pending") return;
    if (!window.confirm(`Duyệt giao dịch của ${item.customer}? Số dư sẽ được tính lại ngay.`)) return;
    setApprovingId(item.id);
    try {
      const response = await fetch(`/api/admin/transactions/${item.id}?kind=pending`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Không duyệt được giao dịch");
      setMessage(`Đã duyệt giao dịch của ${item.customer} và tính lại số dư.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lỗi không xác định");
    } finally {
      setApprovingId(null);
    }
  }

  async function deleteItem(item: DashboardData["management"][number]) {
    const warning = item.kind === "transaction"
      ? `Xóa giao dịch ${item.customer}? Số dư khách sẽ được tính lại.`
      : `Xóa giao dịch đang chờ của ${item.customer}?`;
    if (!window.confirm(warning)) return;
    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/admin/transactions/${item.id}?kind=${item.kind}`, { method: "DELETE", headers: { "x-admin-key": adminKey } });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Không xóa được giao dịch");
      setMessage(`Đã xóa dữ liệu test của ${item.customer}.`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Lỗi không xác định"); }
    finally { setDeletingId(null); }
  }
  const chartData = useMemo(() => data?.daily || [], [data]);

  return <main className="dashboard-shell">
    <header className="dashboard-header"><div><span className="product-badge">Thanh ADS Manager PRO</span><h1>Dashboard Nạp Ads</h1><p>Theo dõi tiền nạp, chi phí Ads, phí dịch vụ và số dư theo từng ngày Việt Nam.</p></div><div className="status-stack"><span className="status-pill">● Bot hoạt động</span><span>{data?.bank ? `${data.bank.label} • ${data.bank.account_no}` : "Chưa tải ngân hàng"}</span></div></header>
    <section className="dashboard-control">
      <div className="admin-key-box"><label htmlFor="admin-key">Khóa quản trị</label><div className="control-row"><input id="admin-key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="ADMIN_SETUP_KEY"/><button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Đang tải" : "Xem dashboard"}</button></div></div>
      <div className="quick-ranges"><button type="button" onClick={() => chooseRange("today")}>Hôm nay</button><button type="button" onClick={() => chooseRange("yesterday")}>Hôm qua</button><button type="button" onClick={() => chooseRange("7days")}>7 ngày</button><button type="button" onClick={() => chooseRange("month")}>Tháng này</button></div>
      <form className="date-range" onSubmit={submit}><label>Từ ngày<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)}/></label><label>Đến ngày<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)}/></label><button type="submit" disabled={loading}>Áp dụng</button></form>
      <p className="dashboard-message">{message}</p>
    </section>
    {data ? <>
      <section className="kpi-grid"><article className="kpi-card"><span>Nạp</span><strong>{money.format(data.totals.deposits)}</strong><small>Trong khoảng đã chọn</small></article><article className="kpi-card"><span>Ads</span><strong>{money.format(data.totals.ads)}</strong><small>Facebook đã tiêu</small></article><article className="kpi-card"><span>Phí</span><strong>{money.format(data.totals.fees)}</strong><small>Phí dịch vụ</small></article><article className="kpi-card accent"><span>Số dư hiện tại</span><strong>{money.format(data.totals.totalBalance)}</strong><small>{data.totals.customerCount} khách hàng</small></article></section>
      <section className="chart-grid"><article className="chart-card chart-wide"><div className="section-heading"><div><span>Biểu đồ cột</span><h2>Nạp và Ads theo ngày</h2></div><small>Chọn từng ngày bằng bộ lọc phía trên</small></div><BarChart rows={chartData}/></article><article className="chart-card chart-wide"><div className="section-heading"><div><span>Biểu đồ đường</span><h2>Tổng số dư khách theo ngày</h2></div><small>Số dư cuối mỗi ngày theo giờ Việt Nam</small></div><BalanceLineChart rows={chartData}/></article></section>
      <section className="data-grid"><article className="table-card"><div className="section-heading"><div><span>Bảng khách hàng</span><h2>Nạp, Ads và số dư</h2></div><small>Chỉnh phí trực tiếp tại từng khách; giao dịch mới dùng mức phí mới.</small></div><div className="table-wrap"><table><thead><tr><th>Khách / Phí %</th><th>Nạp</th><th>Ads</th><th>Phí đã thu</th><th>Số dư</th></tr></thead><tbody>{data.customers.length ? data.customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><div className="inline-fee-editor"><select aria-label={`Phí của ${customer.name}`} value={feeDrafts[customer.id] ?? String(customer.feePercent)} disabled={savingFeeId === customer.id} onChange={(event) => { const value = event.target.value; setFeeDrafts((current) => ({ ...current, [customer.id]: value })); if (value !== "custom") void saveCustomerFee(customer, Number(value)); }}><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option><option value="12">12%</option><option value="15">15%</option><option value="custom">Khác...</option></select>{feeDrafts[customer.id] === "custom" ? <div className="inline-fee-custom"><input aria-label={`Phí tùy chỉnh của ${customer.name}`} type="number" min="0" max="100" step="0.01" placeholder="7.5" onChange={(event) => setFeeDrafts((current) => ({ ...current, [customer.id]: event.target.value }))}/><button type="button" disabled={savingFeeId === customer.id} onClick={() => void saveCustomerFee(customer)}>{savingFeeId === customer.id ? "..." : "Lưu"}</button></div> : null}</div></td><td>{money.format(customer.deposits)}</td><td>{money.format(customer.ads)}</td><td>{money.format(customer.fees)}</td><td className={customer.balance < 0 ? "negative" : "positive"}>{money.format(customer.balance)}</td></tr>) : <tr><td colSpan={5} className="empty">Chưa có dữ liệu trong khoảng đã chọn.</td></tr>}</tbody></table></div></article>
      <article className="recent-card"><div className="section-heading"><div><span>Cập nhật mới</span><h2>Giao dịch gần nhất</h2></div></div><div className="recent-list">{data.recent.length ? data.recent.map((item) => <div key={item.id} className="recent-item"><span className={item.type === "deposit" ? "transaction-icon deposit" : "transaction-icon ads"}>{item.type === "deposit" ? "+" : "−"}</span><div><strong>{item.customer}</strong><small>{formatTime(item.createdAt)}</small></div><b className={item.type === "deposit" ? "positive" : "negative"}>{item.type === "deposit" ? "+" : "−"}{money.format(Math.abs(item.totalEffect))}</b></div>) : <p className="empty">Chưa có giao dịch.</p>}</div></article></section>

      <section className="transaction-manager"><article className="table-card"><div className="section-heading"><div><span>Quản lý dữ liệu test</span><h2>Giao dịch</h2></div><small>Xóa tại website; Telegram không có nút xóa.</small></div><div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Khách</th><th>Loại</th><th>Trạng thái</th><th>Số tiền</th><th>Thao tác</th></tr></thead><tbody>{data.management.length ? data.management.map((item) => <tr key={`${item.kind}-${item.id}`}><td>{formatTime(item.createdAt)}</td><td><strong>{item.customer}</strong></td><td>{item.type === "deposit" ? "Nạp" : item.type === "ads" ? "Ads" : "Hoàn tác"}</td><td><span className={`status-chip ${item.status}`}>{item.status === "pending" ? "Đang chờ" : item.status === "confirmed" ? "Đã xác nhận" : item.status === "reversed" ? "Đã hoàn tác" : item.status}</span></td><td className={item.totalEffect >= 0 ? "positive" : "negative"}>{item.totalEffect >= 0 ? "+" : "−"}{money.format(Math.abs(item.totalEffect))}</td><td><div className="transaction-actions">{item.kind === "pending" && item.status === "pending" ? <button className="approve-transaction" type="button" disabled={approvingId === item.id || deletingId === item.id} onClick={() => void approveItem(item)}>{approvingId === item.id ? "Đang duyệt" : "Duyệt"}</button> : null}<button className="delete-transaction" type="button" disabled={item.locked || deletingId === item.id || approvingId === item.id} onClick={() => void deleteItem(item)}>{item.locked ? "Đã khóa" : deletingId === item.id ? "Đang xóa" : "Xóa"}</button></div></td></tr>) : <tr><td colSpan={6} className="empty">Không có giao dịch.</td></tr>}</tbody></table></div></article></section>
      <footer className="dashboard-footer"><span>Kỳ đang mở: <strong>{data.activePeriod?.period_key || "Chưa có"}</strong></span><nav><a href="/banks">Quản lý ngân hàng</a><a href="/setup">Kiểm tra Telegram</a><a href="/api/health">API Health</a></nav></footer>
    </> : <section className="dashboard-placeholder"><strong>Dashboard đang được bảo vệ</strong><p>Nhập khóa quản trị phía trên. Dữ liệu tài chính không hiển thị công khai.</p></section>}
  </main>;
}
