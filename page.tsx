import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tạo QR chuyển khoản",
  description: "Tạo nhanh mã QR ngân hàng VietQR"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
