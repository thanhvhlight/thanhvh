# Ads Wallet Bot V1.2 Pro

Bot Telegram tạo VietQR và quản lý tiền Nạp Ads. Website là dashboard tham khảo theo từng ngày; thao tác nghiệp vụ vẫn thực hiện nhanh trên Telegram.

## Chức năng chính

### Telegram

- `+10tr anh son`: tạo ảnh QR chỉ có mã QR, không tự thêm nội dung chuyển khoản.
- `-7tr250 anh son`: tính Facebook + phí 12% và hiển thị ngày theo giờ Việt Nam.
- Gõ tên khách: xem tổng nạp, tổng Ads, phí và số dư.
- Menu nút cố định: Nạp tiền, Chốt Ads, Xem khách, Báo cáo ngày, Chốt tháng, Lịch sử, Ngân hàng, Hoàn tác.
- Chống xác nhận một giao dịch hai lần ở tầng database.
- Chốt tháng lưu số dư từng khách, đưa toàn bộ số dư về 0 và mở tháng mới.
- Lỗi callback Telegram hiển thị đúng nội dung lỗi thay vì “Lỗi không xác định”.

### Website Dashboard

- Bảo vệ bằng `ADMIN_SETUP_KEY`.
- Bộ lọc: Hôm nay, Hôm qua, 7 ngày, Tháng này hoặc chọn Từ ngày/Đến ngày.
- Thẻ tổng quan: Nạp, Ads, Phí, Số dư hiện tại.
- Biểu đồ cột Nạp và Ads theo từng ngày.
- Biểu đồ đường số dư lũy kế trong tháng.
- Bảng khách hàng: Nạp, Ads, Phí, Số dư.
- Danh sách giao dịch gần nhất.
- Quản lý ngân hàng: thêm, sửa, xóa, đặt mặc định.

## Quy tắc thời gian

- Múi giờ: `Asia/Ho_Chi_Minh`.
- Một ngày tính từ `00:00:00` đến `23:59:59` giờ Việt Nam.
- Qua 00:00, giao dịch mới tự thuộc ngày mới.
- Không cần mở ngày hoặc chốt ngày.

## Nâng cấp từ V1.1 Pro

### 1. Upload code

Giải nén ZIP và upload đè toàn bộ file lên repository GitHub hiện tại.

Không xóa Supabase và không chạy lại `schema.sql`.

### 2. Nâng cấp Supabase

Vào Supabase → SQL Editor → New query.

Mở file:

```text
supabase/upgrade-v1.1-to-v1.2.sql
```

Copy toàn bộ, dán vào SQL Editor và bấm **Run without RLS** đúng một lần.

File nâng cấp:

- thay hàm khóa sổ tháng bằng bản ổn định và atomic;
- giữ nguyên toàn bộ khách hàng, ngân hàng và giao dịch cũ;
- thêm index để dashboard tải nhanh hơn.

### 3. Redeploy Vercel

Vào:

```text
Vercel → Project → Deployments → Redeploy
```

Chọn **Redeploy without Build Cache**.

Không cần sửa Environment Variables nếu domain và các khóa không đổi.
Không cần kết nối lại webhook Telegram.

### 4. Kiểm tra

1. Mở `/api/health` và xác nhận trả `{ "ok": true }`.
2. Mở `/` và nhập `ADMIN_SETUP_KEY` để xem dashboard.
3. Telegram gửi `/start` để tải menu mới.
4. Test `+10tr test v12`, xác nhận nhận tiền.
5. Test `-1tr test v12`, xác nhận Chốt Ads.
6. Bấm Báo cáo ngày.
7. Hủy hoặc xử lý hết giao dịch đang chờ trước khi test Chốt tháng.

## Cài mới hoàn toàn

1. Tạo project Supabase.
2. Chạy toàn bộ `supabase/schema.sql` một lần.
3. Tạo Telegram bot bằng BotFather.
4. Deploy repository lên Vercel với Node.js 24.x.
5. Thêm Environment Variables:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=https://ten-du-an.vercel.app
ADMIN_SETUP_KEY=
DEFAULT_FEE_PERCENT=12
TIMEZONE=Asia/Ho_Chi_Minh
ALLOWED_TELEGRAM_USER_IDS=
```

6. Redeploy.
7. Mở `/setup`, nhập `ADMIN_SETUP_KEY`, bấm Kết nối Telegram.
8. Gửi `/id`, sau đó điền ID vào `ALLOWED_TELEGRAM_USER_IDS` và redeploy lần cuối.
9. Mở `/banks` để nhập tài khoản ngân hàng thật.

## Lưu ý khi chốt tháng

Bot không cho chốt tháng nếu còn giao dịch trạng thái `pending`. Hãy bấm xác nhận hoặc hủy các QR/chi phí đang chờ trước.

Chốt tháng chạy trong một database transaction. Nếu một bước lỗi, database không bị reset dở dang.

## Kiểm tra dự án

```bash
npm run validate
npm run typecheck
npm run build
```

Dự án dùng:

- Next.js 16
- React 19
- TypeScript 5.9
- Node.js 24
- Supabase
- Telegram Bot API
- VietQR

Biểu đồ website được dựng bằng SVG/CSS nội bộ, không cần thư viện biểu đồ bổ sung.
