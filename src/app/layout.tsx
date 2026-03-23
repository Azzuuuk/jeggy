import type { Metadata } from "next";
import { Inter, Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import MobileNav from "@/components/ui/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { FloatingActionButton } from "@/components/FloatingActionButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Jeggy — Discover, Rate & Track Games",
  description: "A game discovery, rating, and tracking platform. Browse games, rate and review, track your backlog, and connect with fellow gamers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${schibsted.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthProvider>
          <div id="ambient-layer" aria-hidden="true">
            <div className="orb-lime" />
            <div className="orb-indigo" />
            <div className="orb-rose" />
          </div>
          <Navbar />
          <ToastProvider>
            <main className="min-h-screen">{children}</main>
          </ToastProvider>
          <Footer />
          <FloatingActionButton />
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
