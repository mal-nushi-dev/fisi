import nextConfig from "eslint-config-next";

const tsConfig = nextConfig.find((c) => c.name === "next/typescript");

const config = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "out/**",
      "coverage/**",
      "node_modules/**",
      "public/**",
      "Nushi-Genealogy/**",
      "data/generated/**",
      ".agents/**",
      "**/*.d.ts",
    ],
  },
  {
    rules: {
      complexity: ["warn", 15],
      "max-lines-per-function": [
        "warn",
        {
          max: 75,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],
      "max-nested-callbacks": ["warn", 3],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: tsConfig?.plugins,
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["test/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
];

export default config;
