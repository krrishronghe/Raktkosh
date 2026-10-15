import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BloodCellCanvas from "@/components/BloodCellCanvas";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raktkosh — 3D Bio-Vault Blood Bank System",
  description:
    "Next-generation database management platform for blood donors, bio-vault inventory, donations, and hospital requisitions.",
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased relative selection:bg-[#E50914] selection:text-white">
        {/* 3D Interactive Floating Erythrocytes Canvas */}
        <BloodCellCanvas />
        {/* Navigation Bar */}
        <Navigation />
        {/* Main Content View */}
        <main className="flex-1 pb-16 relative z-10">{children}</main>
        {/* Clinical Accreditation & System Footer */}
        <Footer />
      </body>
    </html>
  );
}
