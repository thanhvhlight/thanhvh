# Nâng cấp lên V1.2.2

1. Upload đè toàn bộ code lên GitHub.
2. Supabase SQL Editor: chạy một lần `supabase/upgrade-v1.2.1-to-v1.2.2.sql`.
3. Vercel tự deploy hoặc Redeploy without Build Cache.
4. Không chạy lại schema.sql, không thay Environment Variables, không kết nối lại webhook.

## Thay đổi
- Telegram giữ nút `⏳ Giao dịch đang chờ`; không có nút xóa.
- Website Dashboard có bảng `Quản lý dữ liệu test` và nút Xóa.
- Giao dịch pending/cancelled/expired được xóa trực tiếp.
- Giao dịch đã xác nhận được xóa và số dư khách tự tính lại từ dữ liệu còn lại.
- Giao dịch thuộc tháng đã khóa không thể xóa.
- Tin nhắn cũ trên Telegram vẫn còn trong chat nhưng không còn được tính vào số dư/báo cáo.
