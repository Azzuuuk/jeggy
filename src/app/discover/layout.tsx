import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Discover gamers who share your taste, find your gaming twin, and explore trending players on Jeggy.",
  openGraph: {
    title: "Discover Gamers | Jeggy",
    description: "Find your gaming twin and discover gamers who share your taste.",
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
