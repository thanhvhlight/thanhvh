import { NextRequest, NextResponse } from "next/server";
import { assertAdminKey } from "@/lib/admin";
import { db } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertAdminKey(request.headers.get("x-admin-key"));
    const { id } = await context.params;
    const kind = new URL(request.url).searchParams.get("kind");
    if (!id || !["transaction", "pending"].includes(kind || "")) {
      return NextResponse.json({ ok: false, message: "Thiếu mã hoặc loại giao dịch." }, { status: 400 });
    }

    const rpc = kind === "pending" ? "admin_delete_pending_transaction" : "admin_delete_transaction";
    const args = kind === "pending" ? { p_pending_id: id } : { p_transaction_id: id };
    const { data, error } = await db().rpc(rpc, args);
    if (error) throw error;

    return NextResponse.json({ ok: true, result: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    const message = errorMessage(error);
    return NextResponse.json({ ok: false, message }, { status: message.includes("Khóa quản trị") ? 401 : 400 });
  }
}
