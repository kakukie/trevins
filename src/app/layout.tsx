import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trevins - Platform Tiket Wisata Terpercaya",
  description: "Temukan dan pesan tiket wisata terbaik dengan harga terjangkau. Jelajahi berbagai destinasi menarik di Indonesia bersama Trevins.",
  keywords: ["Trevins", "tiket wisata", "booking tiket", "wisata Indonesia", "destinasi wisata", "liburan"],
  authors: [{ name: "Trevins Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Trevins - Platform Tiket Wisata",
    description: "Temukan dan pesan tiket wisata terbaik dengan harga terjangkau",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trevins",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#2196F3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
