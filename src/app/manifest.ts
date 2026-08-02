import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workout",
    short_name: "Workout",
    description: "Plan your week, run your workout, and track progress over time.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f3f1",
    theme_color: "#f4f3f1",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
