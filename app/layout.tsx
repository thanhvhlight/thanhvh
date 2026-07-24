import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thanh ADS Manager",
  description: "Dashboard Nạp Ads và bot Telegram VietQR",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
