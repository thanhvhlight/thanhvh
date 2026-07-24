# Ads Wallet Bot V1.1 Pro

Bot Telegram quản lý tiền khách chạy Facebook Ads, tạo VietQR, tính phí 12%, theo dõi số dư và khóa sổ theo tháng.

## Cú pháp nhanh

```text
+10tr anh son
-7tr250 anh son
anh son
```

## Chức năng

- Tạo QR nạp tiền, không lưu file ảnh QR vào Supabase.
- Chỉ cộng tiền khi bấm **Đã nhận tiền**.
- Tự tính chi phí Facebook + phí dịch vụ 12%.
- Tra cứu số dư theo tên khách.
- `/today`: báo cáo ngày.
- `/month`: tổng kết và khóa sổ tháng.
- Sau khi khóa sổ: lưu lịch sử, số dư tất cả khách về 0, mở tháng kế tiếp.
- `/history`: xem lại tháng đã khóa.
- `/bank`: chọn ngân hàng mặc định.
- `/undo`: hoàn tác giao dịch gần nhất.
- Trang `/banks`: thêm ngân hàng nhận tiền bằng khóa quản trị.
- Trang `/setup`: kết nối và kiểm tra Telegram webhook.

## Cài đặt nhanh

1. Tạo Supabase và chạy `supabase/schema.sql`.
2. Sửa tài khoản ngân hàng mẫu trong cuối file SQL.
3. Tạo Telegram bot bằng `@BotFather`.
4. Upload source lên GitHub và import vào Vercel.
5. Chọn Node.js `24.x`.
6. Thêm biến môi trường theo `.env.example`.
7. Redeploy, mở `/setup`, nhập `ADMIN_SETUP_KEY`, bấm kết nối Telegram.
8. Nhắn `/id`, thêm ID vào `ALLOWED_TELEGRAM_USER_IDS`, rồi redeploy.

Xem hướng dẫn chi tiết trong thư mục `docs/`.

## Kiểm tra cấu trúc

```bash
npm run validate
```

## Lưu ý

- `SUPABASE_SERVICE_ROLE_KEY` và token Telegram tuyệt đối không commit lên GitHub.
- QR là URL ảnh VietQR, không được lưu thành file trong database.
- Build đầy đủ cần chạy `npm install` trước.
