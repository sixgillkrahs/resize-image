import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PicPress Pro - Resize & Nén Ảnh Hàng Loạt",
  description:
    "Công cụ xử lý, resize, crop và nén ảnh hàng loạt siêu tốc 100% trên trình duyệt. Bảo mật tuyệt đối, không tải ảnh lên máy chủ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#020617] text-slate-100">
        {children}
      </body>
    </html>
  );
}
