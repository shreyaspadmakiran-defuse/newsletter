import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEAR Intents — Product Updates",
  description: "Subscribe to get NEAR Intents feature announcements in your inbox.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
