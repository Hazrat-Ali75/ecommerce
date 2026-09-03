import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BanglaCart | Bangladesh's Premier E-Commerce Marketplace",
  description:
    "Shop authentic Bangladeshi Fashion & Apparel, Footwear, and Smart Gadgets with Cash on Delivery nationwide and 24-48h fast delivery inside Dhaka.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-white text-gray-900 antialiased`}>
        <QueryProvider>
          <StorefrontShell>{children}</StorefrontShell>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
