import type { Metadata } from "next";
import { Outfit, Playfair_Display, Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AmbientMusic } from "@/components/AmbientMusic";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "L.I.F.E. Ministry | Lord Is Forever Emmanuel",
  description:
    "Join L.I.F.E. Ministry every Sunday for interactive worship, connection, and community. Experience God's constant presence together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", geist.variable)}>
      <body
        className={`${outfit.variable} ${playfair.variable} font-body antialiased bg-bg text-text`}
      >
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <AmbientMusic />
      </body>
    </html>
  );
}
