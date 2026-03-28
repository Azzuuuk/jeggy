import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth", "/api", "/settings", "/onboarding", "/reset-password"],
      },
    ],
    sitemap: "https://jeggy.app/sitemap.xml",
  };
}
