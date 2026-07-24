-- Thanh ADS Manager PRO V1.3
-- Bổ sung nút Duyệt giao dịch đang chờ trên website.
-- Khi duyệt, giao dịch được ghi nhận và số dư khách được cập nhật trong cùng transaction.

create or replace function public.admin_approve_pending_transaction(p_pending_id uuid)
returns table(
  transaction_id uuid,
  customer_name text,
  balance_before numeric,
  balance_after numeric,
  total_effect numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.pending_transactions%rowtype;
  c public.customers%rowtype;
  effect numeric;
  tx uuid;
  active_period uuid;
begin
  select id into active_period
  from public.accounting_periods
  where status = 'open'
  order by period_key desc
  limit 1
  for update;

  if active_period is null then
    raise exception 'Không có tháng đang mở';
  end if;

  select * into p
  from public.pending_transactions
  where id = p_pending_id
  for update;

  if not found then
    raise exception 'Không tìm thấy giao dịch đang chờ';
  end if;

  if p.status <> 'pending' then
    raise exception 'Giao dịch không còn ở trạng thái đang chờ';
  end if;

  select * into c
  from public.customers
  where id = p.customer_id
  for update;

  if not found then
    raise exception 'Không tìm thấy khách hàng';
  end if;

  effect := case
    when p.type = 'deposit' then p.amount
    else -(p.amount + p.fee_amount)
  end;

  update public.customers
  set balance = balance + effect,
      updated_at = now()
  where id = c.id;

  insert into public.transactions(
    customer_id,
    pending_id,
    type,
    amount,
    fee_amount,
    total_effect,
    balance_before,
    balance_after,
    bank_id,
    created_by,
    period_id
  ) values (
    c.id,
    p.id,
    p.type,
    p.amount,
    p.fee_amount,
    effect,
    c.balance,
    c.balance + effect,
    p.bank_id,
    p.telegram_user_id,
    active_period
  ) returning id into tx;

  update public.pending_transactions
  set status = 'confirmed',
      confirmed_at = now()
  where id = p.id;

  return query
  select tx, c.name, c.balance, c.balance + effect, effect;
end
$$;
