import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_Tamil } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Tamil glyphs are not in Geist. Listing this second in the CSS font stack
// lets the browser fall back per character, so a mixed Tamil and English line
// renders correctly without any conditional class on the element.
const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EDUS 60-Second Challenge",
  description:
    "5 questions. 60 seconds. Take the EDUS 60-Second Challenge at YGC Innovation Festival 2026.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Booth tablets get poked hard. Locking the scale stops accidental
  // pinch-zoom mid-question, but zooming stays available in browser settings.
  maximumScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${notoTamil.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-100">{children}</body>
    </html>
  );
}
