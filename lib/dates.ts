import { config } from "./config";

const VN_OFFSET_HOURS = 7;
const DAY_MS = 86_400_000;

function parts(date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => p.find((x) => x.type === type)?.value || "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

function zonedMidnightIso(year: number, month: number, day: number) {
  // Việt Nam dùng UTC+7 quanh năm, không có DST.
  return new Date(Date.UTC(year, month - 1, day, -VN_OFFSET_HOURS, 0, 0)).toISOString();
}

export function vnNowParts() {
  return parts();
}

export function vnDateKey(date = new Date()) {
  const { year, month, day } = parts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function vnDateLabel(date = new Date()) {
  const { year, month, day } = parts(date);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function isoRangeForDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error("Ngày không hợp lệ");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  if (cursor.getUTCFullYear() !== year || cursor.getUTCMonth() + 1 !== month || cursor.getUTCDate() !== day) {
    throw new Error("Ngày không hợp lệ");
  }
  const next = new Date(cursor.getTime() + DAY_MS);
  return {
    from: zonedMidnightIso(year, month, day),
    to: zonedMidnightIso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
    label: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
  };
}

export function todayRange() {
  return isoRangeForDateKey(vnDateKey());
}

export function monthRange() {
  const { year, month } = parts();
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return {
    from: zonedMidnightIso(year, month, 1),
    to: zonedMidnightIso(nextMonth.year, nextMonth.month, 1),
    label: `${String(month).padStart(2, "0")}/${year}`,
  };
}

export function isoRangeForDateKeys(fromKey: string, toKey: string) {
  const start = isoRangeForDateKey(fromKey);
  const end = isoRangeForDateKey(toKey);
  if (start.from > end.from) throw new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
  return { from: start.from, to: end.to };
}

export function enumerateDateKeys(fromKey: string, toKey: string) {
  const matchFrom = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromKey);
  const matchTo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toKey);
  if (!matchFrom || !matchTo) throw new Error("Khoảng ngày không hợp lệ");
  let cursor = Date.UTC(Number(matchFrom[1]), Number(matchFrom[2]) - 1, Number(matchFrom[3]));
  const end = Date.UTC(Number(matchTo[1]), Number(matchTo[2]) - 1, Number(matchTo[3]));
  const result: string[] = [];
  while (cursor <= end) {
    const date = new Date(cursor);
    result.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`);
    cursor += DAY_MS;
    if (result.length > 370) throw new Error("Khoảng ngày tối đa là 370 ngày");
  }
  return result;
}

export function vnDateKeyFromIso(iso: string) {
  return vnDateKey(new Date(iso));
}

export function shortDateLabel(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}
