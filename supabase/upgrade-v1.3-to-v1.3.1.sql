-- Thanh ADS Manager PRO V1.3.1
-- Cột fee_percent đã tồn tại từ schema ban đầu.
-- Đoạn này chỉ bảo đảm dữ liệu cũ có mức phí hợp lệ.

alter table public.customers
  add column if not exists fee_percent numeric(5,2) not null default 12;

update public.customers
set fee_percent = 12
where fee_percent is null;

alter table public.customers
  drop constraint if exists customers_fee_percent_check;

alter table public.customers
  add constraint customers_fee_percent_check
  check (fee_percent >= 0 and fee_percent <= 100);
