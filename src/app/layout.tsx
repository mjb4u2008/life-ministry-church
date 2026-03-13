import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AmbientMusic } from "@/components/AmbientMusic";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "L.I.F.E. Ministry | Lord Is Forever Emmanuel",
  description: "Join L.I.F.E. Ministry every Sunday for interactive worship, connection, and community. Experience God's constant presence together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-body antialiased bg-white text-deep`}
      >
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <AmbientMusic />
      </body>
    </html>
  );
}
