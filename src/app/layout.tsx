import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NetworkBanner } from "@/components/layout/network-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gig-a-Chad",
  description: "Post work, compete to deliver, and get paid from escrow on Monad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <NetworkBanner />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
