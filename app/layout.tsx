import type { Metadata } from "next";
import { Geist, Geist_Mono, Great_Vibes, Cormorant_Garamond, Josefin_Sans, EB_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const josefin = Josefin_Sans({
  weight: ["200", "300", "400"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const ebGaramond = EB_Garamond({
  weight: ["400", "500", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  weight: ["200", "300", "400", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "The Feynman",
  description: "Learn anything deeply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${greatVibes.variable}
        ${cormorant.variable}
        ${josefin.variable}
        ${ebGaramond.variable}
        ${manrope.variable}
        h-full antialiased
      `}
    >
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" precedence="default" />
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
