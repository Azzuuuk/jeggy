import type { Metadata } from "next";
import { Inter, Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import MobileNav from "@/components/ui/MobileNav";
import ScrollToTop from "@/components/ScrollToTop";
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

const siteUrl = "https://jeggy.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Jeggy | Discover, Rate & Track Games",
    template: "%s | Jeggy",
  },
  description:
    "Your gaming identity platform. Rate and review games, track your backlog, discover hidden gems, create tier lists, and connect with gamers who share your taste.",
  keywords: [
    "game ratings",
    "game reviews",
    "game tracker",
    "gaming community",
    "game discovery",
    "tier lists",
    "gaming DNA",
    "rate games",
    "video game platform",
    "backlog tracker",
    "gaming taste",
    "indie games",
    "game recommendations",
    "Jeggy",
  ],
  authors: [{ name: "Jeggy", url: siteUrl }],
  creator: "Jeggy",
  publisher: "Jeggy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Jeggy",
    title: "Jeggy | Discover, Rate & Track Games",
    description:
      "Your gaming identity platform. Rate and review games, track your backlog, discover hidden gems, and connect with gamers who share your taste.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jeggy: Discover Your Gaming DNA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeggy | Discover, Rate & Track Games",
    description:
      "Your gaming identity platform. Rate games, discover hidden gems, and find your gaming twin.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "Jeggy",
                  description: "Your gaming identity platform. Rate and review games, track your backlog, discover hidden gems, and connect with gamers who share your taste.",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: "Jeggy",
                  url: siteUrl,
                  logo: { "@type": "ImageObject", url: `${siteUrl}/icon-512.png` },
                  sameAs: [
                    "https://www.tiktok.com/@jeggy.app",
                    "https://www.youtube.com/@Jeggyapp",
                    "https://instagram.com/jeggy.app",
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${schibsted.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthProvider>
          <ScrollToTop />
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
