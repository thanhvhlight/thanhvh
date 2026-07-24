import { config } from "./config";

function parts(date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const get = (t: string) => p.find((x) => x.type === t)?.value || "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")) };
}

function zonedMidnightIso(y: number, m: number, d: number) {
  // Asia/Ho_Chi_Minh is UTC+7 without DST; TIMEZONE remains configurable for display.
  return new Date(Date.UTC(y, m - 1, d, -7, 0, 0)).toISOString();
}

export function todayRange() {
  const { year, month, day } = parts();
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return { from: zonedMidnightIso(year, month, day), to: zonedMidnightIso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()), label: `${String(day).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}` };
}

export function monthRange() {
  const { year, month } = parts();
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return { from: zonedMidnightIso(year, month, 1), to: zonedMidnightIso(nextMonth.y, nextMonth.m, 1), label: `${String(month).padStart(2,"0")}/${year}` };
}
