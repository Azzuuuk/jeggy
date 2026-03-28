import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to your Jeggy account to rate games, track your backlog, and connect with the gaming community.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
