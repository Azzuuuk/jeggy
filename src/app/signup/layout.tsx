import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Join Jeggy for free. Create your gaming profile, rate games, build tier lists, and connect with gamers who share your taste.",
  openGraph: {
    title: "Join Jeggy",
    description: "Create your gaming profile and discover your gaming DNA.",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
