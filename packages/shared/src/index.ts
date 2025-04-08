/**
 * 共享库主入口文件
 * 导出所有平台通用的代码
 */

// 直接导出共享模块的所有内容
export * from './shared';

// 命名空间导出（方便使用）
import * as SharedCommon from './shared/common/index';
import * as SharedTypes from './shared/types';
import * as SharedUtils from './shared/utils';

export const types = SharedTypes;
export const utils = SharedUtils;
export const common = SharedCommon;