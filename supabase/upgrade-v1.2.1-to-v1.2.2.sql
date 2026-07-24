-- Thanh ADS Manager PRO V1.3: quản lý và xóa dữ liệu test từ website.
create or replace function public.admin_delete_pending_transaction(p_pending_id uuid)
returns table(deleted_id uuid, customer_name text)
language plpgsql security definer set search_path = public as $$
declare
  p public.pending_transactions%rowtype;
  customer_label text;
begin
  select * into p from public.pending_transactions where id = p_pending_id for update;
  if not found then raise exception 'Không tìm thấy giao dịch đang chờ'; end if;
  if p.status = 'confirmed' then raise exception 'Giao dịch đã xác nhận. Hãy xóa tại danh sách giao dịch đã hoàn tất'; end if;
  select name into customer_label from public.customers where id = p.customer_id;
  delete from public.pending_transactions where id = p.id;
  return query select p.id, coalesce(customer_label, 'Không rõ');
end $$;

create or replace function public.admin_delete_transaction(p_transaction_id uuid)
returns table(deleted_id uuid, customer_name text, recalculated_balance numeric)
language plpgsql security definer set search_path = public as $$
declare
  target public.transactions%rowtype;
  original_id uuid;
  target_customer_id uuid;
  customer_label text;
  new_balance numeric;
  linked_pending uuid;
  period_status text;
begin
  select * into target from public.transactions where id = p_transaction_id for update;
  if not found then raise exception 'Không tìm thấy giao dịch'; end if;

  if target.period_id is not null then
    select status into period_status from public.accounting_periods where id = target.period_id;
    if period_status = 'closed' then raise exception 'Không thể xóa giao dịch thuộc tháng đã khóa'; end if;
  end if;

  original_id := case when target.type = 'reversal' then target.reversal_of else target.id end;
  select pending_id, customer_id into linked_pending, target_customer_id
  from public.transactions where id = original_id;

  delete from public.transactions where reversal_of = original_id;
  delete from public.transactions where id = original_id;

  if linked_pending is not null then
    delete from public.pending_transactions where id = linked_pending;
  end if;

  select coalesce(sum(total_effect), 0) into new_balance
  from public.transactions
  where customer_id = target_customer_id and status = 'confirmed';

  update public.customers set balance = new_balance, updated_at = now()
  where id = target_customer_id;

  select name into customer_label from public.customers where id = target_customer_id;
  return query select original_id, coalesce(customer_label, 'Không rõ'), new_balance;
end $$;
