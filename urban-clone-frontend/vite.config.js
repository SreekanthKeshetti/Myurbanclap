import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // This forces the PWA to work while we are coding in localhost
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.ico", "1.png", "2.png"],
      manifest: {
        name: "UrbanClone Services",
        short_name: "UrbanClone",
        description: "Quality home services, on demand.",
        theme_color: "#0f172a",
        background_color: "#f8fafc",
        display: "standalone", // This hides the browser URL bar!
        icons: [
          {
            src: "1.png", // 🌟 FIXED NAME
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "2.png", // 🌟 FIXED NAME
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
