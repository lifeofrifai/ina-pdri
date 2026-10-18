import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ina PDRI 2026 - Peta Pemulihan Pascabencana Indonesia",
  description: "Platform GIS Pemetaan dan Analisis Indeks Pemulihan Pascabencana Indonesia (Ina PDRI)",
  icons: {
    icon: "/images/logo-bnpb.png",
    apple: "/images/logo-bnpb.png",
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
        <link rel="icon" href="/images/logo-bnpb.png" type="image/png" />
        <link rel="stylesheet" href="/maplibre-gl.css" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
