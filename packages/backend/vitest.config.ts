import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@contractor/ai-actions": path.resolve(__dirname, "../../packages/ai-actions/src/index.ts"),
      "@contractor/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "eval/**/*.test.ts"],
  },
});
