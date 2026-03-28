import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Lists",
  description:
    "Explore curated game lists and tier rankings created by the community. S/A/B/C/D tier lists, top picks, hidden gems, and more.",
  openGraph: {
    title: "Game Lists | Jeggy",
    description: "Explore curated game lists and tier rankings created by the community.",
  },
};

export default function ListsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
