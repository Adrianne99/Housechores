import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // '@' = src
      "@components": path.resolve(__dirname, "./src/components"), // '@components' = src/components
      // Add more aliases as needed
    },
  },
});
