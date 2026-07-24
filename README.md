# Thanh ADS Manager PRO V1.3

Bot Telegram tạo VietQR và quản lý số dư quảng cáo theo từng khách, thao tác bằng một dòng.

## Cú pháp

```text
+10tr anh son       # tạo QR nhận 10.000.000đ
-7tr250 anh son     # Facebook tiêu 7.250.000đ, tự cộng phí 12%
anh son             # xem số dư khách
/today              # báo cáo hôm nay
/month              # tổng kết và chốt tháng
/history            # xem lịch sử các tháng đã khóa
/bank               # chọn ngân hàng mặc định
/undo               # hoàn tác giao dịch vừa xác nhận
/pending            # xem và xử lý giao dịch đang chờ
/id                 # lấy Telegram User ID
```

Tên có dấu hoặc không dấu đều nhận diện cùng một khách. QR chỉ được gửi qua URL VietQR, không lưu ảnh vào Supabase.

## Luồng tháng

1. Trong tháng, xác nhận tiền vào và chi phí Ads như bình thường.
2. Gửi `/month` để xem số dư từng khách và tổng số dư.
3. Bấm `Chốt khóa sổ` rồi `Đồng ý`.
4. Bot lưu lịch sử tháng, khóa kỳ cũ, đưa số dư tất cả khách về 0 và mở tháng kế tiếp.
5. Dùng `/history` để xem lại tháng đã khóa. Lịch sử chỉ xem, không sửa.

## Cài đặt mới

### 1. Supabase

Tạo project Supabase → SQL Editor → mở `supabase/schema.sql`.

Sửa dòng tài khoản ngân hàng mẫu ở cuối phần v1.0:

```sql
'TPBank', 'TPB', '0123456789', 'NGUYEN VAN A'
```

thành thông tin thật, rồi chạy toàn bộ SQL.

### 2. Telegram

Tạo bot với `@BotFather` bằng `/newbot`, lưu Bot Token.

### 3. GitHub và Vercel

Upload các file trong thư mục dự án lên root repository, để `package.json` nằm ngang hàng với `app`, `lib`, `supabase`.

Import repository vào Vercel:

- Framework: Next.js
- Node.js: 24.x
- Build Command: `npm run build`
- Output Directory: để trống

### 4. Environment Variables

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=ads_wallet_secret_2026
ALLOWED_TELEGRAM_USER_IDS=
ADMIN_SETUP_KEY=
APP_URL=https://ten-du-an.vercel.app
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
DEFAULT_FEE_PERCENT=12
TIMEZONE=Asia/Ho_Chi_Minh
```

Redeploy sau khi thêm biến.

### 5. Kết nối webhook

Mở:

```text
https://ten-du-an.vercel.app/setup
```

Nhập `ADMIN_SETUP_KEY` → Kết nối Telegram → Kiểm tra trạng thái.

Sau đó nhắn `/id`, lấy ID và cập nhật:

```env
ALLOWED_TELEGRAM_USER_IDS=123456789
```

Redeploy lần cuối.

## Nâng cấp từ v1.0

1. Upload đè code v1.1 lên GitHub.
2. Trong Supabase SQL Editor, chạy `supabase/upgrade-v1-to-v1.1.sql` đúng một lần.
3. Redeploy Vercel không dùng cache.
4. Không cần đăng ký lại webhook nếu domain và Bot Token không đổi.

## Lưu ý chốt tháng

Bot không cho khóa sổ nếu còn giao dịch đang chờ xác nhận hoặc hủy. Bấm nút `⏳ Đang chờ` hoặc gửi `/pending` để mở danh sách, sau đó chọn từng giao dịch để xác nhận hoặc hủy.


## Cập nhật menu nhanh

- `/start` hiển thị bàn phím nút cố định.
- Hỗ trợ nút `➕ Nạp tiền`, `➖ Chốt Ads`, báo cáo, lịch sử, ngân hàng và hoàn tác.
- Hỗ trợ lệnh phụ `+naptien` và `-chotads`.
- QR không tự điền nội dung chuyển khoản.
- Caption QR đã được rút gọn.


## V1.2.3
- Telegram có mục giao dịch đang chờ, không có chức năng xóa dữ liệu.
- Website có bảng quản lý giao dịch và nút Xóa dành cho dữ liệu test.
- Xóa giao dịch đã xác nhận sẽ tự tính lại số dư khách.
- Không cho xóa giao dịch thuộc tháng đã khóa.
- Chạy `supabase/upgrade-v1.2.1-to-v1.2.3.sql` một lần khi nâng cấp.

## Duyệt và xóa giao dịch trên website

- **Duyệt** chỉ xuất hiện với giao dịch đang chờ. Khi duyệt, hệ thống ghi giao dịch chính thức và cập nhật số dư khách ngay.
- **Xóa** dùng để dọn dữ liệu test. Nếu xóa giao dịch đã xác nhận, hệ thống tự tính lại số dư khách.
- Giao dịch thuộc tháng đã khóa không thể xóa.
- Sau cả hai thao tác, Dashboard và biểu đồ tự tải lại theo số liệu mới.


## SQL bắt buộc cho nút Duyệt trên website

Khi nâng cấp từ bản cũ, chạy **một lần** file:

```text
supabase/upgrade-v1.2.2-to-v1.3.sql
```

Trong Supabase: **SQL Editor → New query → dán toàn bộ file → Run without RLS**. Không chạy lại `schema.sql` nếu hệ thống đang có dữ liệu.

