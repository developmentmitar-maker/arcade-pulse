import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arcade Pulse — Real-time Google Arcade Update Monitor",
  description:
    "Monitor Google Arcade websites for new game codes, bonus points, and announcements. Get instant email notifications when changes are detected.",
  keywords: [
    "Google Arcade",
    "Arcade Facilitator",
    "Google Cloud",
    "Skill Boost",
    "Game Codes",
    "Bonus Points",
  ],
  openGraph: {
    title: "Arcade Pulse — Real-time Google Arcade Update Monitor",
    description:
      "Monitor Google Arcade websites for updates. Get instant email notifications.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
