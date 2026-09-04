import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // The panel lives at a secret address that is baked into the bundle. Reading
  // it from .env (the same file the server uses) means a plain `npm run build`
  // can never reset it to /admin, which would 404 the real address.
  const env = loadEnv(mode, process.cwd(), "");
  const adminPath = (env.VITE_ADMIN_PATH || env.ADMIN_PATH || "/admin").replace(/\/$/, "") || "/admin";
  console.log(`[toolhub] admin panel path: ${adminPath}`);

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_ADMIN_PATH": JSON.stringify(adminPath)
    },
    server: {
      port: 5173,
      proxy: {
        "/api": { target: "http://localhost:4000", changeOrigin: true },
        "/uploads": { target: "http://localhost:4000", changeOrigin: true }
      }
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        output: {
          // Keep the rarely-changing vendor code in its own long-lived chunk.
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"]
          }
        }
      }
    }
  };
});
