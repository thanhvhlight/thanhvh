-- Ads Wallet Bot v1.1 - chạy toàn bộ file này trong Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  balance numeric(18,0) not null default 0,
  fee_percent numeric(5,2) not null default 12,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  label text not null,
  bank_id text not null,
  account_no text not null,
  account_name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists one_default_bank on public.banks ((is_default)) where is_default = true;

create table if not exists public.pending_transactions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  customer_id uuid not null references public.customers(id),
  type text not null check (type in ('deposit','ads')),
  amount numeric(18,0) not null check (amount > 0),
  fee_amount numeric(18,0) not null default 0,
  bank_id uuid references public.banks(id),
  telegram_user_id bigint not null,
  telegram_chat_id bigint not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','expired')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  pending_id uuid unique references public.pending_transactions(id),
  type text not null check (type in ('deposit','ads','reversal')),
  amount numeric(18,0) not null,
  fee_amount numeric(18,0) not null default 0,
  total_effect numeric(18,0) not null,
  balance_before numeric(18,0) not null,
  balance_after numeric(18,0) not null,
  status text not null default 'confirmed' check (status in ('confirmed','reversed')),
  reversal_of uuid references public.transactions(id),
  bank_id uuid references public.banks(id),
  created_by bigint not null,
  created_at timestamptz not null default now(),
  reversed_at timestamptz
);

create index if not exists transactions_customer_date_idx on public.transactions(customer_id, created_at desc);
create index if not exists transactions_created_by_idx on public.transactions(created_by, created_at desc);

alter table public.customers disable row level security;
alter table public.banks disable row level security;
alter table public.pending_transactions disable row level security;
alter table public.transactions disable row level security;

create or replace function public.confirm_pending_transaction(p_pending_id uuid, p_user_id bigint)
returns table (
  transaction_id uuid, customer_name text, balance_before numeric,
  balance_after numeric, total_effect numeric
)
language plpgsql security definer set search_path = public as $$
declare
  p public.pending_transactions%rowtype;
  c public.customers%rowtype;
  effect numeric;
  tx uuid;
begin
  select * into p from public.pending_transactions where id = p_pending_id for update;
  if not found then raise exception 'Không tìm thấy giao dịch'; end if;
  if p.status <> 'pending' then raise exception 'Giao dịch không còn chờ xác nhận'; end if;
  if p.telegram_user_id <> p_user_id then raise exception 'Bạn không tạo giao dịch này'; end if;

  select * into c from public.customers where id = p.customer_id for update;
  effect := case when p.type = 'deposit' then p.amount else -(p.amount + p.fee_amount) end;

  update public.customers set balance = balance + effect, updated_at = now() where id = c.id;
  insert into public.transactions(customer_id,pending_id,type,amount,fee_amount,total_effect,balance_before,balance_after,bank_id,created_by)
  values(c.id,p.id,p.type,p.amount,p.fee_amount,effect,c.balance,c.balance + effect,p.bank_id,p_user_id)
  returning id into tx;
  update public.pending_transactions set status='confirmed', confirmed_at=now() where id=p.id;

  return query select tx,c.name,c.balance,c.balance+effect,effect;
end $$;

create or replace function public.undo_transaction(p_transaction_id uuid, p_user_id bigint)
returns table (
  reversal_id uuid, customer_name text, balance_before numeric,
  balance_after numeric, total_effect numeric
)
language plpgsql security definer set search_path = public as $$
declare
  t public.transactions%rowtype;
  c public.customers%rowtype;
  rev uuid;
  effect numeric;
begin
  select * into t from public.transactions where id=p_transaction_id for update;
  if not found then raise exception 'Không tìm thấy giao dịch'; end if;
  if t.status <> 'confirmed' or t.type='reversal' then raise exception 'Giao dịch không thể hoàn tác'; end if;
  if t.created_by <> p_user_id then raise exception 'Bạn không tạo giao dịch này'; end if;
  if exists(select 1 from public.transactions where reversal_of=t.id) then raise exception 'Giao dịch đã được hoàn tác'; end if;

  select * into c from public.customers where id=t.customer_id for update;
  effect := -t.total_effect;
  update public.customers set balance=balance+effect, updated_at=now() where id=c.id;
  update public.transactions set status='reversed', reversed_at=now() where id=t.id;
  insert into public.transactions(customer_id,type,amount,fee_amount,total_effect,balance_before,balance_after,status,reversal_of,created_by)
  values(c.id,'reversal',t.amount,t.fee_amount,effect,c.balance,c.balance+effect,'confirmed',t.id,p_user_id)
  returning id into rev;
  return query select rev,c.name,c.balance,c.balance+effect,effect;
end $$;

-- SỬA thông tin dưới đây rồi chạy để thêm tài khoản đầu tiên.
insert into public.banks(label, bank_id, account_no, account_name, is_default)
select 'TPBank', 'TPB', '0123456789', 'NGUYEN VAN A', true
where not exists (select 1 from public.banks);

-- V1.1: kỳ kế toán theo tháng, lưu lịch sử khi khóa sổ.
create table if not exists public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  period_key text not null unique check (period_key ~ '^\\d{4}-\\d{2}$'),
  status text not null default 'open' check (status in ('open','closed')),
  total_balance numeric(18,0) not null default 0,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by bigint
);

create unique index if not exists one_open_accounting_period
  on public.accounting_periods ((status)) where status = 'open';

create table if not exists public.month_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.accounting_periods(id) on delete cascade,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  closing_balance numeric(18,0) not null,
  created_at timestamptz not null default now(),
  unique(period_id, customer_id)
);

alter table public.transactions add column if not exists period_id uuid references public.accounting_periods(id);
create index if not exists transactions_period_idx on public.transactions(period_id, created_at desc);

alter table public.accounting_periods disable row level security;
alter table public.month_snapshots disable row level security;

insert into public.accounting_periods(period_key, status)
select to_char((now() at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM'), 'open'
where not exists (select 1 from public.accounting_periods where status='open');

create or replace function public.confirm_pending_transaction(p_pending_id uuid, p_user_id bigint)
returns table (
  transaction_id uuid, customer_name text, balance_before numeric,
  balance_after numeric, total_effect numeric
)
language plpgsql security definer set search_path = public as $$
declare
  p public.pending_transactions%rowtype;
  c public.customers%rowtype;
  effect numeric;
  tx uuid;
  active_period uuid;
begin
  select id into active_period from public.accounting_periods where status='open' for update;
  if active_period is null then raise exception 'Không có tháng đang mở'; end if;

  select * into p from public.pending_transactions where id = p_pending_id for update;
  if not found then raise exception 'Không tìm thấy giao dịch'; end if;
  if p.status <> 'pending' then raise exception 'Giao dịch không còn chờ xác nhận'; end if;
  if p.telegram_user_id <> p_user_id then raise exception 'Bạn không tạo giao dịch này'; end if;

  select * into c from public.customers where id = p.customer_id for update;
  effect := case when p.type = 'deposit' then p.amount else -(p.amount + p.fee_amount) end;

  update public.customers set balance = balance + effect, updated_at = now() where id = c.id;
  insert into public.transactions(customer_id,pending_id,type,amount,fee_amount,total_effect,balance_before,balance_after,bank_id,created_by,period_id)
  values(c.id,p.id,p.type,p.amount,p.fee_amount,effect,c.balance,c.balance + effect,p.bank_id,p_user_id,active_period)
  returning id into tx;
  update public.pending_transactions set status='confirmed', confirmed_at=now() where id=p.id;

  return query select tx,c.name,c.balance,c.balance+effect,effect;
end $$;

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

  if not found then
    raise exception 'Không có tháng đang mở';
  end if;

  if exists(select 1 from public.pending_transactions where status = 'pending') then
    raise exception 'Còn giao dịch đang chờ. Hãy xác nhận hoặc hủy trước khi chốt tháng';
  end if;

  delete from public.month_snapshots where period_id = current_period.id;
  insert into public.month_snapshots(period_id, customer_id, customer_name, closing_balance)
  select current_period.id, id, name, balance
  from public.customers
  where balance <> 0;

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
