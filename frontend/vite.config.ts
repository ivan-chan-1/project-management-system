import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  server: {
    port: parseInt(process.env.PORT || "5173"), // Use PORT from environment or default to 5173
    host: "0.0.0.0", // Allow access from the network
  },
});
