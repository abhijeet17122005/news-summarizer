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
  title: "News Summarizer & Bias Detector",
  description: "Summarize news articles and detect political or emotional bias using AI.",
  openGraph: {
    title: "News Summarizer & Bias Detector",
    description: "Summarize news articles and detect political or emotional bias using AI.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "News Summarizer & Bias Detector",
    description: "Summarize news articles and detect political or emotional bias using AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
