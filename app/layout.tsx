import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerador de Relatório de Estágio – FAMETRO",
  description: "Gerador automático de relatório de atividades ambulatoriais e produtividade individual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  );
}
