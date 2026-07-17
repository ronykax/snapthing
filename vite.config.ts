import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      manifest: {
        description: "Take a picture, add text, and save to Drive!",
        icons: [
          {
            sizes: "192x192",
            src: "/vite.svg",
            type: "image/svg+xml",
          },
        ],
        name: "SnapThing",
        short_name: "SnapThing",
        theme_color: "#000000",
      },
      registerType: "autoUpdate",
    }),
  ],
});
