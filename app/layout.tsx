import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Nutri Week",
  description: "Planificación nutricional semanal self-hosted para Miguel y Ana."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
