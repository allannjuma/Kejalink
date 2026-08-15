import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeInit } from "@/components/ThemeInit";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kejalink.co.ke"),
  title: {
    default: "Kejalink — Find your next home, zero broker fees",
    template: "%s · Kejalink",
  },
  description:
    "Browse verified rooms and apartments across Kenya. Unlock exact locations and caretaker contacts instantly.",
  keywords: [
    "rooms for rent Kenya",
    "apartments Kenya",
    "bedsitters Nairobi",
    "house hunting Kenya",
    "no broker fees",
    "Kejalink",
  ],
  openGraph: {
    type: "website",
    siteName: "Kejalink",
    locale: "en_KE",
    title: "Kejalink — Find your next home, zero broker fees",
    description:
      "Browse verified rooms and apartments across Kenya. Unlock exact locations and caretaker contacts instantly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kejalink — Find your next home, zero broker fees",
    description:
      "Browse verified rooms and apartments across Kenya. Unlock exact locations and caretaker contacts instantly.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
