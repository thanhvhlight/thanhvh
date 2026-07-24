export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <span className="badge">ADS WALLET BOT v1.1</span>
        <h1>QR + ví tiền quảng cáo</h1>
        <p>Nhập một dòng trong Telegram để tạo QR, xác nhận tiền vào, trừ chi phí Facebook + phí 12% và theo dõi số dư từng khách.</p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>➕ Khách nạp tiền</h2>
          <code className="cmd">+10tr anh sơn</code>
          <p className="small">Bot tạo VietQR. Chỉ khi bấm “Đã nhận tiền”, 10.000.000đ mới được cộng vào số dư.</p>
        </article>
        <article className="card">
          <h2>➖ Chốt chi phí Ads</h2>
          <code className="cmd">-7tr250 anh sơn</code>
          <p className="small">Facebook tiêu 7.250.000đ + phí 12% là 870.000đ. Tổng trừ 8.120.000đ.</p>
        </article>
        <article className="card">
          <h2>👤 Xem khách</h2>
          <code className="cmd">anh sơn</code>
          <p className="small">Xem tổng nạp, tổng Facebook tiêu, tổng phí và số dư hiện tại.</p>
        </article>
        <article className="card">
          <h2>📊 Báo cáo</h2>
          <code className="cmd">/today</code>
          <code className="cmd">/month</code>
          <p className="small">Báo cáo phát sinh ngày/tháng và số dư cuối kỳ.</p>
        </article>
        <article className="card">
          <h2>🏦 Đổi ngân hàng</h2>
          <code className="cmd">/bank</code>
          <p className="small">Chọn tài khoản nhận tiền mặc định ngay bằng nút Telegram.</p>
        </article>
        <article className="card">
          <h2>↩️ Hoàn tác</h2>
          <code className="cmd">/undo</code>
          <p className="small">Hoàn tác giao dịch gần nhất sau một bước xác nhận.</p>
        </article>
      </section>
      <footer>Trạng thái API: <a href="/api/health">/api/health</a></footer>
    </main>
  );
}
