import { getConfig } from "@/lib/config";

export function requireAdmin(request: Request) {
  const expected = process.env.ADMIN_SETUP_KEY?.trim();
  if (!expected) throw new Error("Thiếu biến môi trường ADMIN_SETUP_KEY");

  const received = request.headers.get("x-admin-key")?.trim();
  if (!received || received !== expected) {
    return { authorized: false as const };
  }

  return { authorized: true as const, config: getConfig() };
}

export function getAppUrl(request: Request) {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}
