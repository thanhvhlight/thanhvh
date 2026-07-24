-- ADS Wallet Bot V1.2 Pro
-- Chạy file này đúng một lần nếu đang nâng cấp từ V1.1.

create index if not exists transactions_created_at_idx on public.transactions(created_at desc);
create index if not exists transactions_status_created_at_idx on public.transactions(status, created_at desc);
create index if not exists transactions_customer_created_at_idx on public.transactions(customer_id, created_at desc);

create or replace function public.close_active_period(p_user_id bigint)
returns table (
  closed_period_id uuid, closed_period_key text, closed_total numeric, next_period_key text
)
language plpgsql security definer set search_path = public as $$
declare
  current_period public.accounting_periods%rowtype;
  total numeric := 0;
  next_key text;
begin
  perform pg_advisory_xact_lock(12022026);

  select * into current_period
  from public.accounting_periods
  where status = 'open'
  order by period_key desc
  limit 1
  for update;

  if not found then raise exception 'Không có tháng đang mở'; end if;
  if exists(select 1 from public.pending_transactions where status = 'pending') then
    raise exception 'Còn giao dịch đang chờ. Hãy xác nhận hoặc hủy trước khi chốt tháng';
  end if;

  delete from public.month_snapshots where period_id = current_period.id;
  insert into public.month_snapshots(period_id, customer_id, customer_name, closing_balance)
  select current_period.id, id, name, balance from public.customers where balance <> 0;

  select coalesce(sum(balance), 0) into total from public.customers;
  update public.accounting_periods
  set status = 'closed', total_balance = total, closed_at = now(), closed_by = p_user_id
  where id = current_period.id;

  update public.customers set balance = 0, updated_at = now();

  next_key := to_char((to_date(current_period.period_key || '-01', 'YYYY-MM-DD') + interval '1 month'), 'YYYY-MM');
  insert into public.accounting_periods(period_key, status, total_balance, opened_at, closed_at, closed_by)
  values(next_key, 'open', 0, now(), null, null)
  on conflict(period_key) do update
  set status = 'open', total_balance = 0, opened_at = now(), closed_at = null, closed_by = null;

  return query select current_period.id, current_period.period_key, total, next_key;
end $$;
