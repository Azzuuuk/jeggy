import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Games",
  description:
    "Browse and discover over 10,000 games. Filter by genre, platform, rating, and more. Find your next favorite game on Jeggy.",
  openGraph: {
    title: "Browse Games | Jeggy",
    description: "Browse and discover over 10,000 games. Filter by genre, platform, rating, and more.",
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
