// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {}, // جلوگیری از خطای process is not defined
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");
//   return {
//     plugins: [react()],
//     define: {
//       "process.env": env,
//       global: {}, // شبیه‌سازی global برای مرورگر
//     },
//     build: {
//       outDir: "dist",
//     },
//   };
// });
