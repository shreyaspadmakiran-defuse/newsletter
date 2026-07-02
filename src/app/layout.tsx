import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEAR Intents Product Updates",
  description: "Compose and send NEAR Intents product announcements.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
