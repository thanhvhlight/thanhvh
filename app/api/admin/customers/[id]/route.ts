import { NextRequest, NextResponse } from "next/server";
import { assertAdminKey } from "@/lib/admin";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Lỗi không xác định";
  return NextResponse.json({ ok: false, message }, { status });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const { id } = await context.params;
    const body = await request.json() as { fee_percent?: unknown };
    const feePercent = Number(body.fee_percent);

    if (!id) throw new Error("Thiếu ID khách hàng");
    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      throw new Error("Phí phải nằm trong khoảng 0–100%");
    }

    const rounded = Math.round(feePercent * 100) / 100;
    const { data, error } = await db()
      .from("customers")
      .update({ fee_percent: rounded, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,name,fee_percent,balance")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, customer: data });
  } catch (error) {
    return errorResponse(error, error instanceof Error && error.message.includes("quản trị") ? 401 : 400);
  }
}
