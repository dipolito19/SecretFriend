import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roleta do Amigo Secreto",
  description: "Monte o grupo, cada um conta o que quer ganhar, e a roleta sorteia o amigo secreto.",
};

export const viewport: Viewport = { themeColor: "#b3261e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="wrap">{children}</main>
        <footer className="foot">Roleta do Amigo Secreto · sem login, só diversão 🎁</footer>
      </body>
    </html>
  );
}
