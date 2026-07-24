import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { telegram } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  if (request.headers.get("x-admin-key") !== config.adminSetupKey) return NextResponse.json({ error: "Sai ADMIN_SETUP_KEY" }, { status: 401 });
  const [bot, webhook] = await Promise.all([telegram.getMe(), telegram.getWebhookInfo()]);
  return NextResponse.json({ ok: true, bot, webhook });
}
