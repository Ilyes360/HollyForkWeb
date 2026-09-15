/// <reference types="vitest" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = env.API_PROXY_TARGET || "http://localhost:8000"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      env: {
        // Real backend from .env.local (API_PROXY_TARGET) — MSW handlers use
        // wildcard host patterns ("*/api/...") so this doesn't affect mocked
        // tests. Tests that explicitly bypass MSW (passthrough) hit this URL
        // for real, so it must point at a running backend.
        VITE_API_BASE_URL: `${apiProxyTarget.replace(/\/$/, "")}/api`,
      },
      coverage: {
        provider: "v8",
        include: ["src/**"],
        exclude: ["src/api/generated/**", "src/test/**"],
      },
    },
    build: {
      chunkSizeWarningLimit: 1800, // vendor-mapbox is ~1.7MB but lazy-loaded (not in critical path)
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router"],
            "vendor-query": ["@tanstack/react-query", "ky"],
            "vendor-ui": [
              "@base-ui/react",
              "class-variance-authority",
              "clsx",
              "tailwind-merge",
              "cmdk",
              "sonner",
            ],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-motion": ["motion"],
            "vendor-date": ["date-fns", "react-day-picker"],
            "vendor-icons": ["@hugeicons/core-free-icons", "@hugeicons/react"],
            "vendor-state": ["zustand"],
            "vendor-sentry": ["@sentry/react"],
            "vendor-dnd": ["@dnd-kit/react"],
            "vendor-konva": ["konva", "react-konva"],
            "vendor-recharts": ["recharts"],
            "vendor-mapbox": ["mapbox-gl", "react-map-gl/mapbox"],
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
