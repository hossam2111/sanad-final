import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SANAD Health — Behind Every Decision",
  description:
    "Sovereign health intelligence: one layer connecting hospitals, labs, pharmacies and emergency response — where every clinical decision carries its evidence. لكل قرارٍ سند.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
