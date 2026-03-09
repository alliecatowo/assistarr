import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      thresholds: {
        // Current actual coverage: ~45% statements, ~48% branches, ~39% functions, ~46% lines
        // Thresholds set to realistic values; raise incrementally as test coverage improves
        statements: 35,
        branches: 35,
        functions: 30,
        lines: 35,
      },
      exclude: [
        "node_modules/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.config.*",
        ".next/**",
        "tests/**",
        "artifacts/**",
        "**/*.d.ts",
        "**/types.ts",
        "**/schema.ts",
        "lib/db/migrations/**",
      ],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
