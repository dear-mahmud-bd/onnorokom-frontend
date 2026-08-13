import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest wires the Next.js SWC transform, CSS/image/next-font mocking, and
// .env loading into Jest. `dir` points at the app root so next.config.ts is
// picked up. See node_modules/next/dist/docs/01-app/02-guides/testing/jest.md.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // The `output: "standalone"` build writes .next/standalone/package.json, whose
  // "onnorokom" name collides with the root package.json in Jest's haste map.
  // Ignore the build output so the map has a single module of that name.
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  // Mirror the tsconfig `@/*` path alias so tests import the same way as source.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

// Exported as a function call so next/jest can load the async Next.js config.
export default createJestConfig(config);
