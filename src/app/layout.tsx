import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
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
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-1 flex justify-center items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
              <img 
                src="https://6548935.app.netsuite.com/core/media/media.nl?id=12904734&c=6548935&h=lTRR7c30QxWFNVKbRyFb33OSd6KKQTdFVchouUxSK4Am28ls" 
                alt="Saint Flooring Logo" 
                className="w-14 h-14 object-contain"
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