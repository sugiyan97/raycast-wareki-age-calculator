import raycastConfig from "@raycast/eslint-config";

export default [
  ...raycastConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_$" }],
    },
  },
];
