import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import InstallPrompt from "@/components/InstallPrompt";

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Saint App", // Change this to your desired title
  description: "Saint Group",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Saint App",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-100 text-zinc-900 min-h-screen antialiased font-sans">
        <main className="flex-1 flex flex-col min-h-screen">
          {children}
        </main>
        <Analytics />
        <SpeedInsights />
        <InstallPrompt />
      </body>
    </html>
  );
}