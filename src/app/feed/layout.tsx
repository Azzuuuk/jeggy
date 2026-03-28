import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Feed",
  description:
    "See what your friends are playing, rating, and reviewing. Stay connected with the Jeggy community.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
