// React和React Native相关的ESLint规则
// @ts-check
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactNativePlugin from "eslint-plugin-react-native";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // React相关规则
  {
    files: ["**/apps/client/**/*.jsx", "**/apps/client/**/*.tsx"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React核心规则
      "react/prop-types": "off", // 使用TypeScript，不需要PropTypes
      "react/react-in-jsx-scope": "off", // React 17+不需要导入React
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      "react/no-unstable-nested-components": ["warn", { allowAsProps: true }],
      "react/jsx-key": "error",

      // React Hooks规则
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // React Native和Expo规则
  {
    files: ["**/apps/client/**/*.jsx", "**/apps/client/**/*.tsx"],
    plugins: {
      "react-native": reactNativePlugin,
    },
    rules: {
      // React Native基本规则
      "react-native/no-unused-styles": "error",
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "warn",
      "react-native/no-raw-text": ["warn", { skip: ["Button", "Text"] }],
      "react-native/no-single-element-style-arrays": "error",

      // Expo最佳实践
      "no-console": ["error", { allow: ["warn", "error"] }], // 生产环境不应使用console.log
      "no-alert": "warn", // 避免使用alert

      // 性能相关规则
      "react/no-array-index-key": "warn", // 避免使用数组索引作为key
    },
  },

  // React Native特定TypeScript规则
  {
    files: ["**/apps/client/**/*.ts", "**/apps/client/**/*.tsx"],
    rules: {
      // 放宽某些TypeScript规则，适用于RN项目
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",

      // Expo和React Native开发中常见的最佳实践
      "import/no-extraneous-dependencies": ["error", {
        "devDependencies": [
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}",
          "**/*.e2e.{ts,tsx}",
          "**/metro.config.js",
          "**/babel.config.js",
          "**/jest.config.js"
        ]
      }],
    },
  },
];