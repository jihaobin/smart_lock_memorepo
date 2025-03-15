// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// 查找工作空间的根目录
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. 监视所有文件
config.watchFolders = [workspaceRoot];

// 2. 让 Metro 知道如何解析工作空间中的包
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 强制 Metro 解析工作空间内的模块，而不仅仅是基于 node_modules
config.resolver.disableHierarchicalLookup = true;

// 应用 NativeWind 配置
module.exports = withNativeWind(config, { input: './global.css' });
