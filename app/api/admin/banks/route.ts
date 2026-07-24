import { NextRequest, NextResponse } from "next/server";
import { assertAdminKey } from "@/lib/admin";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Lỗi không xác định";
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const { data, error } = await db().from("banks").select("*").order("is_default", { ascending: false }).order("label");
    if (error) throw error;
    return NextResponse.json({ ok: true, banks: data ?? [] });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const body = await request.json() as Record<string, unknown>;
    const label = String(body.label ?? "").trim();
    const bankId = String(body.bank_id ?? "").trim().toUpperCase();
    const accountNo = String(body.account_no ?? "").replace(/\s+/g, "");
    const accountName = String(body.account_name ?? "").trim().toUpperCase();
    if (!label || !bankId || !accountNo || !accountName) throw new Error("Thiếu thông tin ngân hàng");
    if (!/^\d{5,30}$/.test(accountNo)) throw new Error("Số tài khoản không hợp lệ");

    const { data, error } = await db().from("banks").insert({
      label, bank_id: bankId, account_no: accountNo, account_name: accountName,
      is_active: true, is_default: false,
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, bank: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) throw new Error("Thiếu ID ngân hàng");

    const changes: Record<string, unknown> = {};
    if (body.label !== undefined) changes.label = String(body.label).trim();
    if (body.bank_id !== undefined) changes.bank_id = String(body.bank_id).trim().toUpperCase();
    if (body.account_no !== undefined) changes.account_no = String(body.account_no).replace(/\s+/g, "");
    if (body.account_name !== undefined) changes.account_name = String(body.account_name).trim().toUpperCase();
    if (body.is_active !== undefined) changes.is_active = Boolean(body.is_active);

    const { data, error } = await db().from("banks").update(changes).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, bank: data });
  } catch (error) {
    return errorResponse(error);
  }
}
