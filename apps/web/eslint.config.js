import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // next.config.js runs directly under Node (CJS-ish ESM loader) before the
    // app's TS/browser globals apply, so it needs the Node global `process`.
    files: ["next.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
];
