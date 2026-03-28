import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for games, genres, and developers on Jeggy. Find exactly what you are looking for.",
  openGraph: {
    title: "Search Games | Jeggy",
    description: "Search for games, genres, and developers on Jeggy.",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
