import { config } from "./config";

export function isAllowed(userId?: number): boolean {
  if (!userId) return false;
  const ids = config.allowedUserIds;
  return ids.length === 0 || ids.includes(userId);
}
