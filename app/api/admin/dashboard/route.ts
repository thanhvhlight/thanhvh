import { NextRequest, NextResponse } from "next/server";
import { assertAdminKey } from "@/lib/admin";
import { db } from "@/lib/supabase";
import {
  enumerateDateKeys,
  isoRangeForDateKeys,
  shortDateLabel,
  vnDateKey,
  vnDateKeyFromIso,
} from "@/lib/dates";
import { errorMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CustomerRow = { id: string; name: string; balance: number | string; fee_percent: number | string };

type TransactionRow = {
  id: string;
  type: "deposit" | "ads" | "reversal";
  amount: number | string;
  fee_amount: number | string;
  total_effect: number | string;
  created_at: string;
  status?: "confirmed" | "reversed";
  period_id?: string | null;
  customers: { id: string; name: string } | { id: string; name: string }[] | null;
};

function customerOf(value: TransactionRow["customers"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function jsonError(error: unknown, status = 400) {
  return NextResponse.json({ ok: false, message: errorMessage(error) }, { status });
}

export async function GET(request: NextRequest) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const url = new URL(request.url);
    const today = vnDateKey();
    const fromKey = url.searchParams.get("from") || today;
    const toKey = url.searchParams.get("to") || today;
    const range = isoRangeForDateKeys(fromKey, toKey);
    const dateKeys = enumerateDateKeys(fromKey, toKey);

    const monthStartKey = `${fromKey.slice(0, 7)}-01`;
    const monthToRange = isoRangeForDateKeys(monthStartKey, toKey);

    const [rangeResult, monthResult, customersResult, recentResult, pendingResult, bankResult, periodResult] = await Promise.all([
      db().from("transactions")
        .select("id,type,amount,fee_amount,total_effect,created_at,customers(id,name)")
        .eq("status", "confirmed")
        .gte("created_at", range.from)
        .lt("created_at", range.to)
        .order("created_at", { ascending: true }),
      db().from("transactions")
        .select("id,type,amount,fee_amount,total_effect,created_at,customers(id,name)")
        .eq("status", "confirmed")
        .gte("created_at", monthToRange.from)
        .lt("created_at", monthToRange.to)
        .order("created_at", { ascending: true }),
      db().from("customers").select("id,name,balance,fee_percent").order("name"),
      db().from("transactions")
        .select("id,type,amount,fee_amount,total_effect,created_at,status,period_id,customers(id,name)")
        .order("created_at", { ascending: false })
        .limit(20),
      db().from("pending_transactions")
        .select("id,type,amount,fee_amount,status,created_at,customers(id,name)")
        .in("status", ["pending", "cancelled", "expired"])
        .order("created_at", { ascending: false })
        .limit(100),
      db().from("banks").select("id,label,account_no,account_name,is_default").eq("is_active", true)
        .order("is_default", { ascending: false }).limit(1).maybeSingle(),
      db().from("accounting_periods").select("id,period_key,status,total_balance,opened_at")
        .eq("status", "open").order("period_key", { ascending: false }).limit(1).maybeSingle(),
    ]);

    for (const result of [rangeResult, monthResult, customersResult, recentResult, pendingResult, bankResult, periodResult]) {
      if (result.error) throw result.error;
    }

    const rows = (rangeResult.data || []) as unknown as TransactionRow[];
    const monthRows = (monthResult.data || []) as unknown as TransactionRow[];
    const customers = (customersResult.data || []) as unknown as CustomerRow[];

    const totals = rows.reduce((acc, row) => {
      const amount = Number(row.amount);
      const fee = Number(row.fee_amount);
      if (row.type === "deposit") acc.deposits += amount;
      else { acc.ads += amount; acc.fees += fee; }
      acc.net += Number(row.total_effect);
      return acc;
    }, { deposits: 0, ads: 0, fees: 0, net: 0 });

    const dailyMap = new Map(dateKeys.map((key) => [key, { date: key, label: shortDateLabel(key), deposits: 0, ads: 0, fees: 0, net: 0 }]));
    for (const row of rows) {
      const key = vnDateKeyFromIso(row.created_at);
      const day = dailyMap.get(key);
      if (!day) continue;
      const amount = Number(row.amount);
      const fee = Number(row.fee_amount);
      if (row.type === "deposit") day.deposits += amount;
      else { day.ads += amount; day.fees += fee; }
      day.net += Number(row.total_effect);
    }

    const monthDailyNet = new Map<string, number>();
    for (const row of monthRows) {
      const key = vnDateKeyFromIso(row.created_at);
      monthDailyNet.set(key, (monthDailyNet.get(key) || 0) + Number(row.total_effect));
    }
    let runningBalance = 0;
    const balanceByDate = new Map<string, number>();
    for (const key of enumerateDateKeys(monthStartKey, toKey)) {
      if (key.endsWith("-01") && key !== monthStartKey) runningBalance = 0;
      runningBalance += monthDailyNet.get(key) || 0;
      balanceByDate.set(key, runningBalance);
    }

    const daily = Array.from(dailyMap.values()).map((day) => ({
      ...day,
      balance: balanceByDate.get(day.date) ?? runningBalance,
    }));

    const customerStats = new Map<string, { id: string; name: string; deposits: number; ads: number; fees: number }>();
    for (const row of rows) {
      const customer = customerOf(row.customers);
      if (!customer) continue;
      const current = customerStats.get(customer.id) || { id: customer.id, name: customer.name, deposits: 0, ads: 0, fees: 0 };
      if (row.type === "deposit") current.deposits += Number(row.amount);
      else { current.ads += Number(row.amount); current.fees += Number(row.fee_amount); }
      customerStats.set(customer.id, current);
    }

    const customerRows = customers.map((customer) => {
      const stats = customerStats.get(customer.id) || { deposits: 0, ads: 0, fees: 0 };
      return {
        id: customer.id,
        name: customer.name,
        deposits: stats.deposits,
        ads: stats.ads,
        fees: stats.fees,
        balance: Number(customer.balance),
        feePercent: Number(customer.fee_percent),
      };
    }).filter((item) => item.deposits || item.ads || item.fees || item.balance)
      .sort((a, b) => b.balance - a.balance);

    const totalBalance = customers.reduce((sum, customer) => sum + Number(customer.balance), 0);
    const recent = ((recentResult.data || []) as unknown as TransactionRow[]).map((row) => {
      const customer = customerOf(row.customers);
      return {
        id: row.id,
        type: row.type,
        amount: Number(row.amount),
        fee: Number(row.fee_amount),
        totalEffect: Number(row.total_effect),
        createdAt: row.created_at,
        date: vnDateKeyFromIso(row.created_at),
        customer: customer?.name || "Không rõ",
      };
    });


    const manageableTransactions = ((recentResult.data || []) as unknown as TransactionRow[]).map((row) => {
      const customer = customerOf(row.customers);
      return {
        id: row.id,
        kind: "transaction" as const,
        type: row.type,
        status: row.status || "confirmed",
        amount: Number(row.amount),
        fee: Number(row.fee_amount),
        totalEffect: Number(row.total_effect),
        createdAt: row.created_at,
        customer: customer?.name || "Không rõ",
        locked: Boolean(row.period_id && periodResult.data && row.period_id !== periodResult.data.id),
      };
    });

    const manageablePending = ((pendingResult.data || []) as any[]).map((row) => {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
      return {
        id: row.id,
        kind: "pending" as const,
        type: row.type,
        status: row.status,
        amount: Number(row.amount),
        fee: Number(row.fee_amount),
        totalEffect: row.type === "deposit" ? Number(row.amount) : -(Number(row.amount) + Number(row.fee_amount)),
        createdAt: row.created_at,
        customer: customer?.name || "Không rõ",
        locked: false,
      };
    });

    const management = [...manageablePending, ...manageableTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    return NextResponse.json({
      ok: true,
      range: { from: fromKey, to: toKey },
      totals: { ...totals, totalBalance, customerCount: customers.length },
      daily,
      customers: customerRows,
      recent,
      management,
      bank: bankResult.data || null,
      activePeriod: periodResult.data || null,
      generatedAt: new Date().toISOString(),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const status = errorMessage(error).includes("Khóa quản trị") ? 401 : 400;
    return jsonError(error, status);
  }
}
