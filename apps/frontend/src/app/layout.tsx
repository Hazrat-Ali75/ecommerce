import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BanglaShop | Bangladesh's Premier E-Commerce Marketplace",
  description:
    "Shop authentic Bangladeshi Fashion & Apparel, Footwear, and Smart Gadgets with Cash on Delivery nationwide and 24-48h fast delivery inside Dhaka.",
  keywords: [
    "BanglaShop",
    "Bangladesh Ecommerce",
    "Aarong Panjabi",
    "Jamdani Saree",
    "Apex Shoes",
    "Cash on Delivery Bangladesh",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${montserrat.variable} ${cormorant.variable} font-sans min-h-screen flex flex-col bg-[#FAFAF9] text-gray-900 antialiased selection:bg-primary/15 selection:text-primary`}
      >
        <QueryProvider>
          <StorefrontShell>{children}</StorefrontShell>
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
