import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "sonner@2.0.3": "sonner",
      "@radix-ui/react-slot@1.1.2": "@radix-ui/react-slot",
      "class-variance-authority@0.7.1": "class-variance-authority",
      "@radix-ui/react-select@2.1.6": "@radix-ui/react-select",
      "lucide-react@0.487.0": "lucide-react",
      "@radix-ui/react-label@2.1.2": "@radix-ui/react-label",
      "@radix-ui/react-dialog@1.1.6": "@radix-ui/react-dialog",
      "@radix-ui/react-alert-dialog@1.1.6": "@radix-ui/react-alert-dialog",
      "embla-carousel-react@8.6.0": "embla-carousel-react",
      "recharts@2.15.2": "recharts",
      "@radix-ui/react-toggle@1.1.2": "@radix-ui/react-toggle",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    outDir: "build",
  },
  server: {
    port: 3000,
    host: true, // Enable network access (0.0.0.0)
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', 'localhost'], // Allow ngrok tunnel for mobile testing (camera requires HTTPS)
    // Avoid open: true on Windows — can throw spawn EPERM when launching the browser from Vite
    open: false,
    // Proxy API to backend - use when VITE_API_URL is unset or /api
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
