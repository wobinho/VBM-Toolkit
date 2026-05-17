import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VBM Toolkit — Volleyball Manager Utilities",
  description:
    "A workshop of tools for the Volleyball Manager project: portrait prompt assembly, library curation, and more on the way.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0a0a0c" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
