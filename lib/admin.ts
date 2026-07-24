import { config } from "./config";

export function assertAdminKey(value: string | null) {
  if (!value || value !== config.adminSetupKey) {
    throw new Error("Khóa quản trị không hợp lệ");
  }
}
