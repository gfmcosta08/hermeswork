import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth";

export const metadata: Metadata = {
  title: "FarollWork SaaS",
  description: "Gestão inteligente com WhatsApp + Hermes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
