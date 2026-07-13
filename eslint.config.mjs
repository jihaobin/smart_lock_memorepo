// @ts-check
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import nestTypedPlugin from '@darraghor/eslint-plugin-nestjs-typed';
import importPlugin from 'eslint-plugin-import';
import reactNativeRules from './eslint.config.react-native.mjs';
import pluginRouter from '@tanstack/eslint-plugin-router';

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
  // 忽略文件配置
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/coverage/**',
      '**/apps/client/.expo/**',
      '**/apps/client/ios/**',
      '**/apps/client/android/**',
      '**/.history/**',
      '**/apps/admin/src/routeTree.gen.ts',
    ],
  },

  // 基本JavaScript规则
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    ...js.configs.recommended,
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': 'off', // 由TypeScript规则替代
      'no-unused-expressions': 'off', // 由TypeScript规则替代
    },
  },

  // TypeScript规则
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
          message: 'Use a typed @smart-lock/env entry instead of process.env.',
        },
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.type='MetaProperty'][object.property.name='env'][property.name!='DEV']",
          message: 'Use an app-specific typed env entry instead of import.meta.env.',
        },
      ],
    },
  },

  // 仅配置边界允许读取 Expo/Node 环境；Vite 自定义变量仍受限制。
  {
    files: ['packages/env/**/*.ts', 'apps/client/config/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.type='MetaProperty'][object.property.name='env'][property.name!='DEV']",
          message: 'Use an app-specific typed env entry instead of import.meta.env.',
        },
      ],
    },
  },

  // Nest.js Typed 规则 - 使用实际存在的规则
  {
    files: ['**/apps/api/**/*.ts'],
    plugins: {
      '@darraghor/nestjs-typed': nestTypedPlugin,
    },
    // rules: {
    //   // Nest 模块和依赖注入规则
    //   "@darraghor/nestjs-typed/provided-injected-should-match-factory-parameters": "warn",
    //   "@darraghor/nestjs-typed/injectable-should-be-provided": "warn",

    //   // Swagger/OpenAPI规则
    //   "@darraghor/nestjs-typed/api-property-matches-property-optionality": "warn",
    //   "@darraghor/nestjs-typed/controllers-should-supply-api-tags": "warn",
    //   "@darraghor/nestjs-typed/api-method-should-specify-api-response": "warn",
    //   "@darraghor/nestjs-typed/api-method-should-specify-api-operation": "warn",
    //   "@darraghor/nestjs-typed/api-enum-property-best-practices": "warn",
    //   "@darraghor/nestjs-typed/api-property-returning-array-should-set-array": "warn",

    //   // 防止bug的规则
    //   "@darraghor/nestjs-typed/param-decorator-name-matches-route-param": "warn",
    //   "@darraghor/nestjs-typed/validate-nested-of-array-should-set-each": "warn",
    //   "@darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator": "warn",
    //   "@darraghor/nestjs-typed/all-properties-are-whitelisted": "warn",
    //   "@darraghor/nestjs-typed/all-properties-have-explicit-defined": "warn",
    //   "@darraghor/nestjs-typed/no-duplicate-decorators": "warn",
    //   "@darraghor/nestjs-typed/should-specify-forbid-unknown-values": "warn",

    //   // 安全相关规则 - 可选的,如果你需要强制API端点使用权限守卫
    //   // "@darraghor/nestjs-typed/api-methods-should-be-guarded": "warn",

    //   // 代码一致性规则 - 可选的
    //   // "@darraghor/nestjs-typed/sort-module-metadata-arrays": "warn",
    // },
  },

  // 导入规则
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
          pathGroups: [
            {
              pattern: '@smart-lock/**',
              group: 'internal',
              position: 'before',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
    },
  },

  // 代码风格规则
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/linebreak-style': ['error', 'unix'],
    },
  },

  // React Native和Expo相关规则
  // ...reactNativeRules,

  // 前端特定规则
  {
    files: ['**/apps/admin/**/*.ts', '**/apps/admin/**/*.tsx'],
    rules: {
      // 添加React相关规则，如果前端使用React
    },
    plugins: {
      ...pluginRouter.configs['flat/recommended'],
    },
  },

  // Prettier集成
  prettierConfig,
];
