import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diary",
  description:
    "Your gaming diary on Jeggy. Track daily play sessions and see your gaming activity over time.",
};

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
