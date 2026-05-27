import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "RAG AI — Interrogez vos documents avec une précision chirurgicale",
  description: "Retrieval-Augmented Generation sur vos bases de connaissance — réponses sourcées, 0 hallucination, déploiement en 48h.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body style={{ fontFamily: "var(--font-body)", background: "#f5f3ff" }}>{children}</body>
    </html>
  );
}
