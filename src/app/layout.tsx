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

import PwaRegistry from "@/components/PwaRegistry";

import { Viewport } from 'next'

export const metadata: Metadata = {
  title: "SWU-DSM-FaithLog (슈데페)",
  description: "영성생활 기록 및 공동체 관리 PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "슈데페",
  },
  formatDetection: {
    telephone: false,
  }
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegistry />
        {children}
      </body>
    </html>
  );
}
