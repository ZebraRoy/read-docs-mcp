import { defineConfig } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import stylistic from "@stylistic/eslint-plugin"

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    semi: false,
  }),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        caughtErrorsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
    },
  },
  {
    files: ["**/*.test.{js,ts}", "**/*.spec.{js,ts}", "**/__tests__/**/*.{js,ts}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-unused-expressions": "off",
    },
  },
  {
    ignores: ["dist", "node_modules"],
  },
])
