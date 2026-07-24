import { db } from "./supabase";
import { config } from "./config";
import { displayName, normalizeName } from "./money";
import type { Bank } from "./types";

export async function getOrCreateCustomer(name: string) {
  const supabase = db();
  const normalized = normalizeName(name);
  const { data: existing, error: findError } = await supabase
    .from("customers").select("*").eq("normalized_name", normalized).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;
  const { data, error } = await supabase.from("customers").insert({
    name: displayName(name), normalized_name: normalized, fee_percent: config.defaultFeePercent,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function findCustomer(name: string) {
  const { data, error } = await db().from("customers").select("*")
    .eq("normalized_name", normalizeName(name)).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDefaultBank(): Promise<Bank> {
  const { data, error } = await db().from("banks").select("*").eq("is_active", true)
    .order("is_default", { ascending: false }).order("created_at", { ascending: true }).limit(1).single();
  if (error) throw new Error("Chưa có ngân hàng. Hãy chạy SQL seed trong Supabase.");
  return data as Bank;
}

export async function listBanks(): Promise<Bank[]> {
  const { data, error } = await db().from("banks").select("*").eq("is_active", true)
    .order("is_default", { ascending: false }).order("label");
  if (error) throw error;
  return (data || []) as Bank[];
}

export async function setDefaultBank(bankId: string) {
  const supabase = db();
  const { error: e1 } = await supabase.from("banks").update({ is_default: false }).eq("is_default", true);
  if (e1) throw e1;
  const { data, error } = await supabase.from("banks").update({ is_default: true }).eq("id", bankId).select("*").single();
  if (error) throw error;
  return data as Bank;
}

export async function createPending(args: {
  customerId: string; type: "deposit" | "ads"; amount: number; feeAmount: number;
  bankId?: string; telegramUserId: number; telegramChatId: number;
}) {
  const { data, error } = await db().from("pending_transactions").insert({
    customer_id: args.customerId, type: args.type, amount: args.amount,
    fee_amount: args.feeAmount, bank_id: args.bankId || null,
    telegram_user_id: args.telegramUserId, telegram_chat_id: args.telegramChatId,
  }).select("*, customers(*), banks(*)").single();
  if (error) throw error;
  return data;
}

export async function getPending(id: string) {
  const { data, error } = await db().from("pending_transactions").select("*, customers(*), banks(*)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function changePendingBank(pendingId: string, bankId: string) {
  const { data, error } = await db().from("pending_transactions").update({ bank_id: bankId })
    .eq("id", pendingId).eq("status", "pending").select("*, customers(*), banks(*)").single();
  if (error) throw error;
  return data;
}

export async function changePendingBankByCode(pendingCode: string, bankCode: string) {
  const supabase = db();
  const { data: pending, error: pError } = await supabase.from("pending_transactions").select("id").eq("code", pendingCode).single();
  if (pError) throw pError;
  const { data: bank, error: bError } = await supabase.from("banks").select("id").eq("code", bankCode).single();
  if (bError) throw bError;
  return changePendingBank(pending.id, bank.id);
}

export async function cancelPending(id: string) {
  const { data, error } = await db().from("pending_transactions").update({ status: "cancelled" })
    .eq("id", id).eq("status", "pending").select("*").single();
  if (error) throw error;
  return data;
}

export async function confirmPending(id: string, userId: number) {
  const { data, error } = await db().rpc("confirm_pending_transaction", { p_pending_id: id, p_user_id: userId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getSummary(customerId: string, from?: string, to?: string) {
  let q = db().from("transactions").select("type, amount, fee_amount, total_effect, status, created_at")
    .eq("customer_id", customerId).eq("status", "confirmed");
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lt("created_at", to);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data || [];
  return rows.reduce((acc, row) => {
    if (row.type === "deposit") acc.deposits += Number(row.amount);
    else { acc.ads += Number(row.amount); acc.fees += Number(row.fee_amount); }
    acc.net += Number(row.total_effect);
    return acc;
  }, { deposits: 0, ads: 0, fees: 0, net: 0, count: rows.length });
}

export async function listCustomers() {
  const { data, error } = await db().from("customers").select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function getLastConfirmedTransaction(userId: number) {
  const { data, error } = await db().from("transactions").select("*, customers(*)")
    .eq("created_by", userId).eq("status", "confirmed").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function undoTransaction(transactionId: string, userId: number) {
  const { data, error } = await db().rpc("undo_transaction", { p_transaction_id: transactionId, p_user_id: userId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getActivePeriod() {
  const { data, error } = await db().from("accounting_periods").select("*")
    .eq("status", "open").order("period_key", { ascending: false }).limit(1).single();
  if (error) throw new Error("Chưa có kỳ kế toán đang mở. Hãy chạy schema v1.1 trong Supabase.");
  return data;
}

export async function getActivePeriodSummary() {
  const period = await getActivePeriod();
  const { data, error } = await db().from("customers").select("id,name,balance").order("name");
  if (error) throw error;
  const customers = (data || []).filter((c) => Number(c.balance) !== 0);
  return {
    period,
    customers,
    totalBalance: customers.reduce((sum, c) => sum + Number(c.balance), 0),
  };
}

export async function closeActivePeriod(userId: number) {
  const { data, error } = await db().rpc("close_active_period", { p_user_id: userId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function listClosedPeriods() {
  const { data, error } = await db().from("accounting_periods").select("id,period_key,closed_at,total_balance")
    .eq("status", "closed").order("period_key", { ascending: false }).limit(24);
  if (error) throw error;
  return data || [];
}

export async function getClosedPeriod(periodId: string) {
  const supabase = db();
  const { data: period, error: pError } = await supabase.from("accounting_periods").select("*").eq("id", periodId).single();
  if (pError) throw pError;
  const { data: rows, error: rError } = await supabase.from("month_snapshots")
    .select("customer_name,closing_balance").eq("period_id", periodId).order("customer_name");
  if (rError) throw rError;
  return { period, rows: rows || [] };
}
