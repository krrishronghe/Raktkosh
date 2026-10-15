import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raktkosh — Blood Bank Management System",
  description:
    "A centralized, reliable platform for managing blood donors, blood inventory, donations, and blood requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col bg-[#141212] text-[#F5F5F1] selection:bg-[#E50914] selection:text-white antialiased">
        <Navigation />
        <main className="flex-1 pb-16">{children}</main>
      </body>
    </html>
  );
}
