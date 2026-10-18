import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ina PDRI 2026 - Peta Pemulihan Pascabencana Indonesia",
  description: "Platform GIS Pemetaan dan Analisis Indeks Pemulihan Pascabencana Indonesia (Ina PDRI)",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "256x256" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/icon.png?v=2" type="image/png" sizes="256x256" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180" />
        <link rel="stylesheet" href="/maplibre-gl.css" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
