import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { telegram } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  if (key !== config.adminSetupKey) return NextResponse.json({ error: "Sai ADMIN_SETUP_KEY" }, { status: 401 });
  const result = await telegram.setWebhook(`${config.appUrl}/api/telegram`);
  return NextResponse.json({ ok: true, result });
}
