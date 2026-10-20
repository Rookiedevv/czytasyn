import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Czytasyn",
    short_name: "Czytasyn",
    description: "Nauka czytania dla dzieci — po polsku i po angielsku.",
    start_url: "/app",
    display: "standalone",
    orientation: "landscape",
    background_color: "#fffbeb",
    theme_color: "#f59e0b",
    lang: "pl",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
