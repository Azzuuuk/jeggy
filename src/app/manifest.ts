import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jeggy",
    short_name: "Jeggy",
    description:
      "Your gaming identity platform. Rate games, discover hidden gems, and find your gaming twin.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e14",
    theme_color: "#06ffa5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
