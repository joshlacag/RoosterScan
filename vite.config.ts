// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: "./client",
  publicDir: "../public",
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: [
      '.ngrok-free.dev', // Allow all ngrok domains
      '.ngrok.io',
      'localhost',
      '127.0.0.1',
      'rooster-scan.vercel.app',
      'rooster-scan-*.vercel.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    },
    cors: {
      origin: [
        'http://localhost:5173',
        'https://rooster-scan.vercel.app',
        'https://rooster-scan-*.vercel.app',
        'https://*.ngrok-free.dev'
      ],
      credentials: true
    },
    fs: {
      allow: ["./client", "./shared", "./"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "client/index.html")
    }
  },
  plugins: [react(), mode === 'development' ? expressPlugin() : null].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): any {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      // Only import server in development mode
      const { createServer } = await import("./server");
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
