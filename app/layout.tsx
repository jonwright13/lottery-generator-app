import { Navbar } from "@/components/nav";
import { Providers } from "@/components/providers";
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
  title: "Lottery Number Generator",
  description: "Generate new lottery numbers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <div className="flex min-h-screen justify-center font-sans">
            <main className="flex w-full justify-center lg:max-w-6xl flex-col gap-y-6 py-32 px-16  sm:items-start border">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
