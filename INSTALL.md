# Cài đặt Thanh ADS Manager PRO V1.3

## A. Cài mới hoàn toàn

### 1. Tạo Supabase

1. Tạo project mới tại Supabase.
2. Mở `SQL Editor` → `New query`.
3. Trong mã nguồn, mở `supabase/schema.sql`.
4. Tìm tài khoản ngân hàng mẫu ở cuối file và sửa:

```sql
'TPBank', 'TPB', '0123456789', 'NGUYEN VAN A'
```

5. Dán toàn bộ file SQL vào Supabase và chọn **Run without RLS**.
6. Kiểm tra phải có các bảng:

```text
accounting_periods
banks
customers
month_snapshots
pending_transactions
transactions
```

### 2. Lấy thông tin Supabase

Trong Supabase vào `Project Settings` → `API` hoặc `Data API`:

- `Project URL` → dùng cho `SUPABASE_URL`.
- `service_role key` hoặc Server Secret Key → dùng cho `SUPABASE_SERVICE_ROLE_KEY`.

Không dùng `anon key` và không đưa service role key lên GitHub.

### 3. Tạo Telegram Bot

1. Mở Telegram và tìm `@BotFather`.
2. Gửi `/newbot`.
3. Đặt tên bot và username.
4. Sao chép Bot Token.

### 4. Upload GitHub

Upload **toàn bộ nội dung bên trong thư mục dự án** lên root repository. Cấu trúc đúng:

```text
app/
components/
lib/
supabase/
package.json
INSTALL.md
README.md
```

`package.json` phải nằm ở root repository, không nằm trong một thư mục lồng bên trong.

### 5. Import vào Vercel

1. Vercel → `Add New` → `Project`.
2. Chọn repository GitHub.
3. Cấu hình:

```text
Framework Preset: Next.js
Root Directory: .
Node.js Version: 24.x
Build Command: npm run build
Output Directory: để trống
```

### 6. Environment Variables

Vercel → Project → `Settings` → `Environment Variables`, thêm đủ:

```env
TELEGRAM_BOT_TOKEN=token_tu_botfather
TELEGRAM_WEBHOOK_SECRET=chuoi_bi_mat_tu_dat
ALLOWED_TELEGRAM_USER_IDS=
ADMIN_SETUP_KEY=mat_khau_quan_tri_tu_dat
APP_URL=https://ten-du-an.vercel.app
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key
DEFAULT_FEE_PERCENT=12
TIMEZONE=Asia/Ho_Chi_Minh
```

Chọn `Production` và `Preview`. `APP_URL` không có dấu `/` ở cuối.

### 7. Redeploy

Vercel → `Deployments` → deployment mới nhất → `Redeploy` → không dùng Build Cache.

### 8. Kết nối webhook

Mở:

```text
https://ten-du-an.vercel.app/setup
```

Nhập `ADMIN_SETUP_KEY`, bấm:

1. `Kết nối Telegram`
2. `Kiểm tra trạng thái`

Webhook đúng phải trỏ tới:

```text
https://ten-du-an.vercel.app/api/telegram
```

### 9. Giới hạn người sử dụng

Ban đầu để trống:

```env
ALLOWED_TELEGRAM_USER_IDS=
```

Nhắn bot:

```text
/id
```

Bot trả Telegram User ID. Quay lại Vercel và cập nhật:

```env
ALLOWED_TELEGRAM_USER_IDS=123456789
```

Nhiều người dùng:

```env
ALLOWED_TELEGRAM_USER_IDS=123456789,987654321
```

Redeploy lần cuối.

### 10. Kiểm tra vận hành

```text
/start
+10tr test
-1tr test
test
/today
/pending
```

Sau khi kiểm tra, dữ liệu test có thể xóa tại Dashboard website.

---

## B. Nâng cấp từ V1.2.3 lên V1.3

V1.3 đổi thương hiệu và hoàn thiện tài liệu, không thay đổi cấu trúc database.

1. Sao lưu repository hiện tại nếu cần.
2. Upload đè toàn bộ code V1.3 lên GitHub.
3. **Không chạy lại `schema.sql`.**
4. **Không cần chạy SQL nâng cấp.**
5. Giữ nguyên toàn bộ Environment Variables.
6. Vercel → Redeploy without Build Cache.
7. Telegram gửi `/start` hoặc `/menu` để hiện menu mới.

Dữ liệu Supabase hiện có được giữ nguyên.

---

## C. Nâng cấp từ bản cũ hơn

- Từ V1.1: chạy `supabase/upgrade-v1.1-to-v1.2.sql` một lần.
- Nếu chưa có chức năng xóa dữ liệu test trên website: chạy `supabase/upgrade-v1.2.1-to-v1.2.2.sql` một lần.
- Sau đó upload code V1.3 và redeploy.

Không chạy các file nâng cấp nhiều lần nếu trước đó đã chạy thành công.

---

## D. Lỗi thường gặp

### Bot không phản hồi

- Kiểm tra `/setup` và webhook.
- Kiểm tra `TELEGRAM_BOT_TOKEN`.
- Kiểm tra `ALLOWED_TELEGRAM_USER_IDS`.
- Xem Vercel Logs tại request `POST /api/telegram`.

### QR dùng sai tài khoản

Mở `/banks` trên website, sửa hoặc đặt ngân hàng mặc định. QR đã tạo trước đó không tự thay đổi.

### Không chốt được tháng

Bot không cho chốt nếu còn giao dịch treo. Bấm `⏳ Đang chờ` hoặc gửi `/pending`, sau đó xác nhận hoặc hủy từng giao dịch.

### Menu Telegram bị ẩn

Gửi:

```text
/menu
```

#
## Duyệt và xóa giao dịch trên website

- **Duyệt** chỉ xuất hiện với giao dịch đang chờ. Khi duyệt, hệ thống ghi giao dịch chính thức và cập nhật số dư khách ngay.
- **Xóa** dùng để dọn dữ liệu test. Nếu xóa giao dịch đã xác nhận, hệ thống tự tính lại số dư khách.
- Giao dịch thuộc tháng đã khóa không thể xóa.
- Sau cả hai thao tác, Dashboard và biểu đồ tự tải lại theo số liệu mới.

## Website không tải dữ liệu

- Kiểm tra `SUPABASE_URL`.
- Kiểm tra `SUPABASE_SERVICE_ROLE_KEY`.
- Kiểm tra `ADMIN_SETUP_KEY`.
- Mở `/api/health` để kiểm tra API.

## SQL bắt buộc cho nút Duyệt trên website

Khi nâng cấp từ bản cũ, chạy **một lần** file:

```text
supabase/upgrade-v1.2.2-to-v1.3.sql
```

Trong Supabase: **SQL Editor → New query → dán toàn bộ file → Run without RLS**. Không chạy lại `schema.sql` nếu hệ thống đang có dữ liệu.

