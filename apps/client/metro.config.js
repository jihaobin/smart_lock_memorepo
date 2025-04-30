// Learn more https://docs.expo.io/guides/customizing-metro
const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// 查找工作空间的根目录
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. 优化监视文件夹配置
config.watchFolders = [
  path.resolve(workspaceRoot), // 只监视共享包
];

// 2. 让 Metro 知道如何解析工作空间中的包
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 强制 Metro 解析工作空间内的模块，而不仅仅是基于 node_modules
config.resolver.disableHierarchicalLookup = true;

// 4. 添加对子路径导出的支持
config.resolver.extraNodeModules = {
  '@smart-lock/shared': path.resolve(workspaceRoot, 'packages/shared'),
  '@smart-lock/shared/client': path.resolve(workspaceRoot, 'packages/shared/dist/client'),
};

// 5. 添加黑名单配置，排除不需要监视的文件和文件夹
config.resolver.blockList = [
  // 排除所有node_modules (除了必要的包)
  /\/node_modules\/(?!(@smart-lock|react|react-native|expo)\/).*$/,
  // 排除构建目录
  /\.git\/.*/,
  /\.vscode\/.*/,
  /android\/.*/,
  /ios\/.*/,
  /\.expo\/.*/,
  /\.turbo\/.*/,
  /dist\/.*/,
  /build\/.*/,
  // 排除测试文件
  /.*\/__tests__\/.*/,
  /.*\.test\.(js|jsx|ts|tsx)$/,
  // 排除其他应用
  /\/apps\/api\/.*/,
  /\/apps\/admin\/.*/,
];

// 6. 优化缓存配置
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

// 应用 NativeWind 配置
module.exports = withNativeWind(config, { input: './global.css' });
