import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Contractor App",
  description: "Premium Contractor Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-100 text-zinc-900 min-h-screen antialiased font-sans">
        {/* Global Navigation Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex justify-center items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
              <Image 
                src="/logo.png" 
                alt="Saint Flooring Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-contain"
                priority
              />
              Contractor App
            </Link>
          </div>
        </header>
        
        {/* Main Page Content */}
        <main>
          {children}
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}