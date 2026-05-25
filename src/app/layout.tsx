import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VBM Toolkit — Volleyball Manager Utilities",
  description:
    "A quiet workshop of tools for the Volleyball Manager project: portrait prompt assembly and club badge composition.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Hanken+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0c0c0d" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
