# Nâng cấp lên Thanh ADS Manager PRO V1.3

Từ V1.2.3:

1. Upload đè toàn bộ code V1.3 lên GitHub.
2. Không chạy lại schema và không cần SQL nâng cấp.
3. Giữ nguyên Environment Variables.
4. Redeploy Vercel không dùng Build Cache.
5. Gửi `/start` hoặc `/menu` trên Telegram.

Dữ liệu Supabase được giữ nguyên.

## SQL bắt buộc cho nút Duyệt trên website

Khi nâng cấp từ bản cũ, chạy **một lần** file:

```text
supabase/upgrade-v1.2.2-to-v1.3.sql
```

Trong Supabase: **SQL Editor → New query → dán toàn bộ file → Run without RLS**. Không chạy lại `schema.sql` nếu hệ thống đang có dữ liệu.

