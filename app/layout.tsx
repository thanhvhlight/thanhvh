import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ads Wallet Bot v1.0",
  description: "Telegram bot quản lý tiền nạp, chi phí Facebook và QR VietQR",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
