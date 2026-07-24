# Bảo mật

- Không commit `.env` hoặc service role key.
- Đặt `ALLOWED_TELEGRAM_USER_IDS` sau khi lấy ID bằng `/id`.
- Dùng chuỗi ngẫu nhiên dài cho `TELEGRAM_WEBHOOK_SECRET` và `ADMIN_SETUP_KEY`.
- Route webhook kiểm tra secret token của Telegram.
- Các API quản trị yêu cầu header `x-admin-key`.
