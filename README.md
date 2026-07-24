# Telegram VietQR Bot Pro

Bot Telegram chạy bằng Next.js trên Vercel. Nhắn `4.2tr | CK` để bot trả ảnh VietQR đúng số tiền và nội dung.

## Công nghệ
- Next.js 15 App Router
- TypeScript
- Node.js 24
- Telegram Bot API webhook
- VietQR Quick Link
- Vercel Functions

## Biến môi trường Vercel
Sao chép `.env.example` và thêm đầy đủ trong **Vercel → Settings → Environment Variables**:

- `TELEGRAM_BOT_TOKEN`: token lấy từ @BotFather
- `TELEGRAM_WEBHOOK_SECRET`: chuỗi bí mật webhook
- `ADMIN_SETUP_KEY`: khóa mở trang quản trị Pro
- `BANK_ID`: mã ngân hàng, ví dụ MB, VCB, BIDV
- `BANK_ACCOUNT_NO`: số tài khoản
- `BANK_ACCOUNT_NAME`: tên chủ tài khoản
- `DEFAULT_TRANSFER_CONTENT`: mặc định `CK`
- `ALLOWED_TELEGRAM_USER_IDS`: các Telegram ID được phép, ngăn cách dấu phẩy; để trống là không giới hạn
- `APP_URL`: URL Production Vercel, ví dụ `https://ten-du-an.vercel.app`

## Triển khai
1. Đưa toàn bộ code lên GitHub.
2. Import repository vào Vercel.
3. Chọn Node.js 24.x.
4. Thêm các Environment Variables phía trên.
5. Redeploy.
6. Mở URL website.
7. Nhập `ADMIN_SETUP_KEY`.
8. Bấm **Kết nối Telegram**.
9. Nhắn bot: `4.2tr | CK`.

Không cần Terminal, VPS hoặc máy tính bật liên tục.

## Cú pháp bot
- `4.2tr | CK` → 4.200.000đ
- `4tr | THANH TOAN` → 4.000.000đ
- `4000k | DON 125` → 4.000.000đ
- `4.200.000 | CK` → 4.200.000đ
- Chỉ gửi `4.2tr` thì dùng nội dung mặc định.

## Lệnh bot
- `/start`
- `/help`
- `/id`

## Bảo mật
- Không đưa `.env.local` hoặc token lên GitHub.
- Đặt `ADMIN_SETUP_KEY` dài và khó đoán.
- Sau khi lấy ID bằng `/id`, nên điền `ALLOWED_TELEGRAM_USER_IDS` để chặn người lạ.
