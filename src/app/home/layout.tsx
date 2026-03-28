import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Your personalized Jeggy dashboard. See recommendations, trending games, and activity from gamers you follow.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
