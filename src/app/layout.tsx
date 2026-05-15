import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Newsreader, Allura } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const signature = Allura({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
});

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zach Yeo — Photography Journal",
    template: "%s — Zach Yeo",
  },
  description:
    "A daily photography journal and selected portfolio rooted in Tokyo.",
  metadataBase: new URL("https://photos.zachyeo.com"),
  openGraph: {
    title: "Zach Yeo — Photography Journal",
    description: "A daily photography journal and selected portfolio rooted in Tokyo.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zach Yeo — Photography Journal",
    description: "A daily photography journal and selected portfolio rooted in Tokyo.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${serif.variable} ${signature.variable} ${sans.variable}`}>
        {children}
      </body>
    </html>
  );
}
