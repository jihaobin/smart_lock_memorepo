// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

// 查找工作空间的根目录
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. 优化监视文件夹配置
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/env'),
  path.resolve(workspaceRoot, 'packages/shared'),
];

// Windows路径修复
if (process.platform === 'win32') {
  config.resolver.platforms = ['native', 'web', 'android', 'ios'];
}

// 2. 让 Metro 知道如何解析工作空间中的包
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 强制 Metro 解析工作空间内的模块
config.resolver.disableHierarchicalLookup = true;

// 4. 添加对子路径导出的支持
config.resolver.extraNodeModules = {
  '@smart-lock/env': path.resolve(workspaceRoot, 'packages/env'),
  '@smart-lock/env/client': path.resolve(workspaceRoot, 'packages/env/dist/client'),
  '@smart-lock/shared': path.resolve(workspaceRoot, 'packages/shared'),
  '@smart-lock/shared/client': path.resolve(workspaceRoot, 'packages/shared/dist/client'),
};

// 5. 优化黑名单配置，减少监视的文件
// config.resolver.blockList = [
//   // 排除所有node_modules (除了必要的包)
//   /\/node_modules\/(?!(@smart-lock|react|react-native|expo|@expo|@react-native)\/).*$/,
//   // 排除构建目录
//   /\.git\/.*/,
//   /\.vscode\/.*/,
//   /android\/.*/,
//   /ios\/.*/,
//   /\.expo\/.*/,
//   /\.turbo\/.*/,
//   /dist\/.*/,
//   /build\/.*/,
//   /\.tsbuildinfo$/,
//   // 排除测试文件
//   /.*\/__tests__\/.*/,
//   /.*\.test\.(js|jsx|ts|tsx)$/,
//   // 排除其他应用
//   /\/apps\/api\/.*/,
//   /\/apps\/admin\/.*/,
//   // 排除缓存文件
//   /\.metro-cache\/.*/,
//   /node_modules\/.*\/node_modules\/.*/,
// ];

// 6. 优化缓存配置
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: path.join(projectRoot, '.metro-cache'),
  }),
];

// 7. 添加内存优化配置
config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));

// 8. 优化 transformer 配置
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// 应用 NativeWind和recommended动画库 配置
module.exports = wrapWithReanimatedMetroConfig(withNativeWind(config, { input: './global.css' }));
