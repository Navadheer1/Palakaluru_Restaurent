import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CulinaCloud | Palakaluru Restaurant Management System",
  description: "Enterprise POS, Table Management, Kitchen Display, and Inventory Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50/50 dark:bg-slate-950 font-sans`}>
        {children}
      </body>
    </html>
  );
}
