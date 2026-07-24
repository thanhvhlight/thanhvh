import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true, service: "ads-wallet-bot", version: "1.0.0" }); }
