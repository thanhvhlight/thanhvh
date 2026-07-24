export function errorMessage(error: unknown, fallback = "Lỗi không xác định") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    for (const key of ["message", "details", "hint", "error_description"]) {
      if (typeof value[key] === "string" && value[key]) return String(value[key]);
    }
  }
  return fallback;
}

export function throwDbError(error: unknown): never {
  throw new Error(errorMessage(error, "Lỗi cơ sở dữ liệu"));
}
