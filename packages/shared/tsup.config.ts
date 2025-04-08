import { defineConfig, Options } from 'tsup';

// 基础构建配置
const baseConfig: Options = {
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
};

// 通用外部依赖
const commonExternals = [
  'dotenv',
  'drizzle-kit',
  'pg',
  'node:process',
  'fs',
  'path',
  'os',
  'crypto'
];

export default defineConfig([
  // 核心包（所有平台）
  {
    ...baseConfig,
    entry: ['src/index.ts'],
    outDir: 'dist',
    external: commonExternals,
  },

  // 专门构建shared模块
  {
    ...baseConfig,
    entry: ['src/shared/index.ts'],
    outDir: 'dist/shared',
    external: commonExternals,
  },

  // 客户端包（适用于浏览器和React Native）
  {
    ...baseConfig,
    entry: ['src/client/index.ts'],
    outDir: 'dist/client',
    // 包含React Native相关依赖
    noExternal: ['react-native'],
    // 排除Node.js相关依赖，确保客户端环境兼容
    external: commonExternals,
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        // 明确替换Node.js特定API
        'process.versions': '{}',
        'process.env.NODE_ENV': '""',
        'process.env': '{}',
      };
      // 使用neutral平台设置，兼容浏览器和React Native
      options.platform = 'neutral';
      // 替换Node.js模块
      options.alias = {
        ...options.alias,
        fs: 'empty:fs',
        path: 'empty:path',
        os: 'empty:os',
        crypto: 'empty:crypto',
        'node:process': 'empty:process',
        'process': 'empty:process',
        'pg': 'empty:pg',
        'dotenv': 'empty:dotenv',
        'drizzle-orm/node-postgres': 'empty:drizzle',
      };
      return options;
    },
  },

  // 服务端包（仅适用于Node.js）
  {
    ...baseConfig,
    entry: ['src/server/index.ts'],
    outDir: 'dist/server',
    // 排除pg等依赖（将在运行时提供）
    external: ['pg', ...commonExternals],
    esbuildOptions(options) {
      options.platform = 'node';
      return options;
    },
  },

  // API模块（用于单独访问API功能）
  {
    ...baseConfig,
    entry: ['src/api/index.ts'],
    outDir: 'dist/api',
    external: commonExternals,
  }
]);