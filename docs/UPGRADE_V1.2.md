# Nâng cấp nhanh V1.1 → V1.2 Pro

1. Upload đè code V1.2 lên GitHub.
2. Chạy `supabase/upgrade-v1.1-to-v1.2.sql` đúng một lần.
3. Vercel → Redeploy without Build Cache.
4. Telegram → `/start`.
5. Website → nhập `ADMIN_SETUP_KEY` tại trang chủ.

Không chạy lại `schema.sql`. Không xóa bảng. Không thay Environment Variables.
