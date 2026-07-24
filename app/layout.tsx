import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ads Wallet Bot V1.2 Pro",
  description: "Dashboard Nạp Ads và bot Telegram VietQR",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
