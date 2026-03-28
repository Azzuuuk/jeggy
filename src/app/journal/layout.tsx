import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Your gaming journal on Jeggy. Log play sessions, track hours, and reflect on your gaming journey.",
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
