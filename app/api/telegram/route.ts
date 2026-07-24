import { NextRequest, NextResponse } from "next/server";
import { isAllowed } from "@/lib/access";
import { config } from "@/lib/config";
import { monthRange, todayRange, vnDateLabel } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { formatVnd, normalizeName, parseTransaction } from "@/lib/money";
import {
  cancelPending, changePendingBankByCode, confirmPending, createPending, findCustomer,
  getDefaultBank, getLastConfirmedTransaction, getOrCreateCustomer, getPending,
  getSummary, listBanks, listCustomers, listPendingTransactions, setDefaultBank, undoTransaction,
  closeActivePeriod, getActivePeriodSummary, getClosedPeriod, listClosedPeriods,
} from "@/lib/repository";
import { telegram } from "@/lib/telegram";
import type { Bank, TelegramUpdate } from "@/lib/types";
import { vietQrUrl } from "@/lib/vietqr";

export const runtime = "nodejs";
export const maxDuration = 15;

const kb = (rows: Array<Array<{ text: string; callback_data: string }>>) => ({ inline_keyboard: rows });

const mainMenu = {
  keyboard: [
    [{ text: "➕ Nạp tiền" }, { text: "➖ Chốt Ads" }],
    [{ text: "👤 Xem khách" }, { text: "📊 Báo cáo ngày" }],
    [{ text: "📅 Chốt tháng" }, { text: "📚 Lịch sử" }],
    [{ text: "🏦 Ngân hàng" }, { text: "↩️ Hoàn tác" }],
    [{ text: "⏳ Đang chờ" }, { text: "🆔 Lấy ID" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

async function restoreMainMenu(chatId: number) {
  return telegram.sendMessage(chatId, "⌨️ <b>Menu chính</b>", mainMenu);
}

async function sendInlineThenRestoreMenu<T>(chatId: number, sender: () => Promise<T>) {
  const result = await sender();
  await restoreMainMenu(chatId);
  return result;
}

function depositButtons(id: string) {
  return kb([
    [{ text: "✅ Đã nhận tiền", callback_data: `deposit_confirm:${id}` }],
    [{ text: "🏦 Đổi ngân hàng", callback_data: `deposit_banks:${id}` }],
    [{ text: "✏️ Sửa", callback_data: `pending_edit:${id}` }, { text: "❌ Hủy", callback_data: `pending_cancel:${id}` }],
  ]);
}

function adsButtons(id: string) {
  return kb([[{ text: "✅ Xác nhận", callback_data: `ads_confirm:${id}` }, { text: "❌ Hủy", callback_data: `pending_cancel:${id}` }]]);
}

async function sendDeposit(chatId: number, pending: any) {
  return sendInlineThenRestoreMenu(chatId, () =>
    telegram.sendPhoto(chatId, vietQrUrl(pending.banks as Bank, Number(pending.amount)), undefined, depositButtons(pending.id)),
  );
}

async function customerText(customer: any) {
  const all = await getSummary(customer.id);
  return [
    `<b>👤 ${customer.name.toUpperCase()}</b>`, "",
    `Tổng đã nạp: <b>${formatVnd(all.deposits)}</b>`,
    `Facebook đã tiêu: <b>${formatVnd(all.ads)}</b>`,
    `Tổng phí: <b>${formatVnd(all.fees)}</b>`,
    `Tổng đã trừ: <b>${formatVnd(all.ads + all.fees)}</b>`, "",
    `💰 Số dư hiện tại: <b>${formatVnd(Number(customer.balance))}</b>`,
    `Phí Ads: ${Number(customer.fee_percent)}%`,
  ].join("\n");
}

async function reportText(kind: "today" | "month") {
  const range = kind === "today" ? todayRange() : monthRange();
  const customers = await listCustomers();
  const lines = [`<b>📊 BÁO CÁO ${kind === "today" ? "NGÀY" : "THÁNG"} ${range.label}</b>`, ""];
  let deposits = 0, ads = 0, fees = 0;
  for (const c of customers) {
    const s = await getSummary(c.id, range.from, range.to);
    if (!s.count) continue;
    deposits += s.deposits; ads += s.ads; fees += s.fees;
    lines.push(`<b>${c.name}</b>`, `+ Nạp: ${formatVnd(s.deposits)}`, `- Ads: ${formatVnd(s.ads)}`, `- Phí: ${formatVnd(s.fees)}`, `= Biến động: ${formatVnd(s.net)}`, `Số dư hiện tại: ${formatVnd(Number(c.balance))}`, "");
  }
  lines.push("────────────", `Tổng nạp: <b>${formatVnd(deposits)}</b>`, `Facebook tiêu: <b>${formatVnd(ads)}</b>`, `Phí: <b>${formatVnd(fees)}</b>`, `Biến động: <b>${formatVnd(deposits - ads - fees)}</b>`);
  return lines.join("\n");
}


function monthCloseText(summary: any) {
  const periodLabel = summary.period.period_key.split("-").reverse().join("/");
  const lines = [`<b>🔒 CHỐT THÁNG • ${periodLabel}</b>`, ""];
  if (!summary.customers.length) lines.push("Chưa có số dư khách trong tháng này.", "");
  for (const c of summary.customers) lines.push(`<b>${c.name}</b>: ${formatVnd(Number(c.balance))}`);
  lines.push("", "────────────", `Tổng dư        <b>${formatVnd(summary.totalBalance)}</b>`);
  return lines.join("\n");
}

function closeMonthButtons() {
  return kb([[{ text: "✅ Chốt khóa sổ", callback_data: "month_close_confirm" }, { text: "❌ Hủy", callback_data: "noop" }]]);
}

function finalCloseButtons() {
  return kb([[{ text: "✅ Đồng ý", callback_data: "month_close_execute" }, { text: "❌ Quay lại", callback_data: "month_close_preview" }]]);
}


function pendingListText(rows: any[]) {
  const deposits = rows.filter((row) => row.type === "deposit").length;
  const ads = rows.length - deposits;
  return [
    "<b>⏳ GIAO DỊCH ĐANG CHỜ</b>",
    "",
    `Tổng cộng: <b>${rows.length}</b>`,
    `Nạp tiền: <b>${deposits}</b> • Chốt Ads: <b>${ads}</b>`,
    "",
    "Bấm vào giao dịch bên dưới để xác nhận hoặc hủy.",
  ].join("\n");
}

function pendingListButtons(rows: any[]) {
  return kb(rows.map((row) => [{
    text: `${row.type === "deposit" ? "➕" : "➖"} ${row.customers?.name || "Khách"} • ${formatVnd(Number(row.type === "deposit" ? row.amount : Number(row.amount) + Number(row.fee_amount)))}`,
    callback_data: `pending_view:${row.id}`,
  }]));
}

async function sendPendingDetail(chatId: number, pending: any) {
  if (pending.type === "deposit") return sendDeposit(chatId, pending);
  const customer = pending.customers;
  const amount = Number(pending.amount);
  const fee = Number(pending.fee_amount);
  const balance = Number(customer?.balance || 0);
  return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, [
    `<b>📉 CHỐT ADS • ${vnDateLabel()}</b>`, "",
    `👤 <b>${customer?.name || "Khách"}</b>`, "",
    `Facebook      <b>${formatVnd(amount)}</b>`,
    `Phí (${Number(customer?.fee_percent || config.defaultFeePercent)}%)       <b>${formatVnd(fee)}</b>`,
    "───────────────",
    `Tổng trừ      <b>${formatVnd(amount + fee)}</b>`, "",
    "<b>Số dư</b>",
    `${formatVnd(balance)} ➜ <b>${formatVnd(balance - amount - fee)}</b>`,
  ].join("\n"), adsButtons(pending.id)));
}

async function handleMessage(update: TelegramUpdate) {
  const msg = update.message;
  if (!msg?.text || !msg.from) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();

  if (!isAllowed(userId)) {
    await telegram.sendMessage(chatId, `⛔ Bạn không có quyền sử dụng bot.\nTelegram ID: <code>${userId}</code>`);
    return;
  }

  if (text === "/start" || text === "/help" || text === "/menu") {
    return telegram.sendMessage(chatId, [
      "<b>Thanh ADS Manager PRO</b>",
      "",
      "Chọn nút bên dưới hoặc nhập trực tiếp.",
    ].join("\n"), mainMenu);
  }

  if (text === "➕ Nạp tiền" || text.toLowerCase() === "+naptien") {
    return telegram.sendMessage(chatId, "Nhập theo mẫu: <code>+10tr tên khách</code>", mainMenu);
  }
  if (text === "➖ Chốt Ads" || text.toLowerCase() === "-chotads") {
    return telegram.sendMessage(chatId, "Nhập theo mẫu: <code>-7tr250 tên khách</code>", mainMenu);
  }
  if (text === "👤 Xem khách") {
    return telegram.sendMessage(chatId, "Nhập tên khách cần xem.", mainMenu);
  }
  if (text === "⏳ Đang chờ" || text === "/pending") {
    const rows = await listPendingTransactions(userId);
    if (!rows.length) return telegram.sendMessage(chatId, "✅ Không có giao dịch nào đang chờ.", mainMenu);
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, pendingListText(rows), pendingListButtons(rows)));
  }
  if (text === "🆔 Lấy ID" || text === "/id") return telegram.sendMessage(chatId, `Telegram User ID: <code>${userId}</code>`, mainMenu);
  if (text === "📊 Báo cáo ngày" || text === "/today") return telegram.sendMessage(chatId, await reportText("today"), mainMenu);
  if (text === "📅 Chốt tháng") {
    const summary = await getActivePeriodSummary();
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, monthCloseText(summary), closeMonthButtons()));
  }
  if (text === "/month") {
    const summary = await getActivePeriodSummary();
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, monthCloseText(summary), closeMonthButtons()));
  }
  if (text === "📚 Lịch sử" || text === "/history") {
    const periods = await listClosedPeriods();
    if (!periods.length) return telegram.sendMessage(chatId, "Chưa có tháng nào đã khóa sổ.");
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, "<b>📚 LỊCH SỬ THÁNG</b>", kb(periods.map((p: any) => [{ text: p.period_key.split("-").reverse().join("/"), callback_data: `history_period:${p.id}` }]))));
  }
  if (text === "🏦 Ngân hàng" || text === "/bank") {
    const banks = await listBanks();
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, "<b>🏦 CHỌN NGÂN HÀNG MẶC ĐỊNH</b>", kb(banks.map((b: Bank) => [{ text: `${b.is_default ? "✅ " : ""}${b.label} • ${b.account_no}`, callback_data: `bank_default:${b.id}` }]))));
  }
  if (text === "↩️ Hoàn tác" || text === "/undo") {
    const last = await getLastConfirmedTransaction(userId);
    if (!last) return telegram.sendMessage(chatId, "Không có giao dịch nào để hoàn tác.");
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, ["<b>↩️ HOÀN TÁC GIAO DỊCH?</b>", "", `Khách: ${last.customers.name}`, `Loại: ${last.type === "deposit" ? "Nạp tiền" : "Chi phí Ads"}`, `Giá trị số dư: ${formatVnd(Math.abs(Number(last.total_effect)))}`].join("\n"), kb([[{ text: "✅ Hoàn tác", callback_data: `undo_confirm:${last.id}` }, { text: "❌ Không", callback_data: "noop" }]])));
  }

  const parsed = parseTransaction(text);
  if (parsed) {
    const customer = await getOrCreateCustomer(parsed.customerName);
    if (parsed.type === "deposit") {
      const bank = await getDefaultBank();
      const pending = await createPending({ customerId: customer.id, type: "deposit", amount: parsed.amount, feeAmount: 0, bankId: bank.id, telegramUserId: userId, telegramChatId: chatId });
      return sendDeposit(chatId, pending);
    }
    const fee = Math.round(parsed.amount * Number(customer.fee_percent) / 100);
    const after = Number(customer.balance) - parsed.amount - fee;
    const pending = await createPending({ customerId: customer.id, type: "ads", amount: parsed.amount, feeAmount: fee, telegramUserId: userId, telegramChatId: chatId });
    return sendInlineThenRestoreMenu(chatId, () => telegram.sendMessage(chatId, [
      `<b>📉 CHỐT ADS • ${vnDateLabel()}</b>`, "",
      `👤 <b>${customer.name}</b>`, "",
      `Facebook      <b>${formatVnd(parsed.amount)}</b>`,
      `Phí (${Number(customer.fee_percent)}%)       <b>${formatVnd(fee)}</b>`,
      "───────────────",
      `Tổng trừ      <b>${formatVnd(parsed.amount + fee)}</b>`, "",
      `<b>Số dư</b>`,
      `${formatVnd(Number(customer.balance))} ➜ <b>${formatVnd(after)}</b>`,
      after < 0 ? "\n⚠️ Số dư sau giao dịch sẽ âm." : "",
    ].join("\n"), adsButtons(pending.id)));
  }

  const customer = await findCustomer(text);
  if (customer) return telegram.sendMessage(chatId, await customerText(customer));
  return telegram.sendMessage(chatId, "Không hiểu lệnh. Ví dụ: <code>+10tr anh son</code> hoặc <code>-7tr250 anh son</code>.");
}

async function handleCallback(update: TelegramUpdate) {
  const q = update.callback_query;
  if (!q?.data || !q.message) return;
  const chatId = q.message.chat.id;
  const userId = q.from.id;
  const messageId = q.message.message_id;
  if (!isAllowed(userId)) return telegram.answerCallbackQuery(q.id, "Không có quyền", true);
  const [action, id, extra] = q.data.split(":");

  try {
    if (action === "noop") return telegram.answerCallbackQuery(q.id, "Đã giữ nguyên");
    if (action === "pending_view") {
      const pending = await getPending(id);
      if (!pending || pending.status !== "pending") throw new Error("Giao dịch này không còn ở trạng thái chờ");
      await telegram.answerCallbackQuery(q.id);
      return sendPendingDetail(chatId, pending);
    }
    if (action === "pending_cancel") {
      const pending = await getPending(id);
      await cancelPending(id); await telegram.answerCallbackQuery(q.id, "Đã hủy");
      return pending?.type === "deposit"
        ? telegram.editMessageCaption(chatId, messageId, "❌ Giao dịch đã hủy.")
        : telegram.editMessageText(chatId, messageId, "❌ Giao dịch đã hủy.");
    }
    if (action === "pending_edit") {
      const pending = await getPending(id);
      await cancelPending(id); await telegram.answerCallbackQuery(q.id, "Nhập lại giao dịch");
      const text = "✏️ Giao dịch cũ đã hủy. Hãy nhập lại, ví dụ: <code>+10tr anh son</code> hoặc <code>-7tr250 anh son</code>.";
      return pending?.type === "deposit"
        ? telegram.editMessageCaption(chatId, messageId, text)
        : telegram.editMessageText(chatId, messageId, text);
    }
    if (action === "deposit_confirm" || action === "ads_confirm") {
      const result = await confirmPending(id, userId);
      await telegram.answerCallbackQuery(q.id, "Đã lưu giao dịch");
      const isDeposit = action === "deposit_confirm";
      const doneText = [
        `<b>${isDeposit ? "✅ ĐÃ NHẬN" : "✅ ĐÃ CHỐT ADS"} • ${vnDateLabel()}</b>`, "",
        `👤 <b>${result.customer_name}</b>`,
        `${Number(result.total_effect) >= 0 ? "➕" : "➖"} <b>${formatVnd(Math.abs(Number(result.total_effect)))}</b>`, "",
        `💰 Số dư: <b>${formatVnd(Number(result.balance_after))}</b>`,
      ].join("\n");
      return action === "deposit_confirm"
        ? telegram.editMessageCaption(chatId, messageId, doneText)
        : telegram.editMessageText(chatId, messageId, doneText);
    }
    if (action === "deposit_banks") {
      const [banks, pending] = await Promise.all([listBanks(), getPending(id)]);
      if (!pending) throw new Error("Không tìm thấy giao dịch");
      await telegram.answerCallbackQuery(q.id);
      return telegram.editMessageCaption(chatId, messageId, "<b>🏦 Chọn ngân hàng cho QR này</b>", kb(banks.map((b: Bank) => [{ text: `${b.label} • ${b.account_no}`, callback_data: `dbank:${pending.code}:${b.code}` }])));
    }
    if (action === "dbank") {
      if (!extra) throw new Error("Thiếu mã ngân hàng");
      const pending = await changePendingBankByCode(id, extra);
      await telegram.answerCallbackQuery(q.id, `Đã chọn ${pending.banks.label}`);
      return telegram.editMessageMedia(chatId, messageId, vietQrUrl(pending.banks as Bank, Number(pending.amount)), undefined, depositButtons(pending.id));
    }
    if (action === "bank_default") {
      const bank = await setDefaultBank(id);
      await telegram.answerCallbackQuery(q.id, `Đã chọn ${bank.label}`);
      return telegram.editMessageText(chatId, messageId, `✅ Ngân hàng mặc định: <b>${bank.label}</b>\nSTK: <code>${bank.account_no}</code>`);
    }
    if (action === "month_close_preview") {
      const summary = await getActivePeriodSummary();
      await telegram.answerCallbackQuery(q.id);
      return telegram.editMessageText(chatId, messageId, monthCloseText(summary), closeMonthButtons());
    }
    if (action === "month_close_confirm") {
      const summary = await getActivePeriodSummary();
      const label = summary.period.period_key.split("-").reverse().join("/");
      await telegram.answerCallbackQuery(q.id);
      return telegram.editMessageText(chatId, messageId, [
        `<b>Xác nhận chốt tháng ${label}?</b>`, "",
        `Tổng số dư sẽ lưu vào lịch sử: <b>${formatVnd(summary.totalBalance)}</b>`, "",
        "Sau khi đồng ý:", "• Lưu lịch sử tháng", "• Đưa số dư tất cả khách về 0đ", "• Mở kỳ tháng mới",
      ].join("\n"), finalCloseButtons());
    }
    if (action === "month_close_execute") {
      const result = await closeActivePeriod(userId);
      await telegram.answerCallbackQuery(q.id, "Đã khóa sổ");
      const oldLabel = String(result.closed_period_key).split("-").reverse().join("/");
      const newLabel = String(result.next_period_key).split("-").reverse().join("/");
      return telegram.editMessageText(chatId, messageId, [
        `<b>✅ ĐÃ CHỐT THÁNG ${oldLabel}</b>`, "",
        `Tổng số dư đã lưu: <b>${formatVnd(Number(result.closed_total))}</b>`,
        "Số dư tất cả khách đã về <b>0đ</b>.",
        `Đã mở kỳ tháng <b>${newLabel}</b>.`, "",
        "Dùng nút Lịch sử để xem lại tháng đã khóa.",
      ].join("\n"));
    }
    if (action === "history_period") {
      const history = await getClosedPeriod(id);
      await telegram.answerCallbackQuery(q.id);
      const label = history.period.period_key.split("-").reverse().join("/");
      const lines = [`<b>📊 LỊCH SỬ THÁNG ${label}</b>`, ""];
      if (!history.rows.length) lines.push("Không có số dư khách.");
      for (const row of history.rows) lines.push(`<b>${row.customer_name}</b>: ${formatVnd(Number(row.closing_balance))}`);
      lines.push("", "────────────", `💰 Tổng số dư: <b>${formatVnd(Number(history.period.total_balance))}</b>`, "", "🔒 Báo cáo đã khóa, chỉ được xem.");
      return telegram.editMessageText(chatId, messageId, lines.join("\n"));
    }
    if (action === "undo_confirm") {
      const result = await undoTransaction(id, userId);
      await telegram.answerCallbackQuery(q.id, "Đã hoàn tác");
      return telegram.editMessageText(chatId, messageId, ["<b>✅ ĐÃ HOÀN TÁC</b>", "", `Khách: ${result.customer_name}`, `Số dư trước hoàn tác: ${formatVnd(Number(result.balance_before))}`, `Số dư sau hoàn tác: <b>${formatVnd(Number(result.balance_after))}</b>`].join("\n"));
    }
  } catch (error) {
    const message = errorMessage(error);
    console.error("Telegram callback error", { action, id, message, error });
    return telegram.answerCallbackQuery(q.id, message.slice(0, 180), true);
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("x-telegram-bot-api-secret-token") !== config.webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const update = await request.json() as TelegramUpdate;
    if (update.callback_query) await handleCallback(update); else await handleMessage(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() { return NextResponse.json({ ok: true, endpoint: "telegram-webhook" }); }
