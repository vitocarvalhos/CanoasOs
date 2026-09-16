import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Canoas Sales OS", template: "%s · Canoas Sales OS" },
  description: "Sistema de execução comercial da Canoas Media",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
