import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], ...js.configs.recommended },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    }
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
    }
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "no-prototype-builtins": "warn",
      "no-case-declarations": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "no-useless-escape": "warn",
      "no-unreachable": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
  {
    ignores: [
      "build/",
      "dist/",
      "node_modules/",
      ".vscode/",
      ".github/",
      "coverage/",
      "firebase-debug.log",
      "*.test.ts",
      "*.test.tsx",
      "*.test.js",
      "src/reportWebVitals.js",
      "src/setupTests.js",
      "vite.config.ts",
      "vitest.config.ts",
      "src/test/setup.ts",
      "**/__tests__/*",
      "eslint.config.mjs",
    ],
  },
];
