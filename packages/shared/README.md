# @smart-lock/shared

智能锁项目的共享代码库

## 用法

### 导入通用代码

```typescript
// 默认导入方式（获取所有通用功能）
import { isNode, Environment, ApiResponse } from '@smart-lock/shared';

// 也可以使用命名空间导入（可选）
import { types, utils, common } from '@smart-lock/shared';
const { ApiResponse } = types;
const { isNode } = utils;
const { Environment } = common;
```

### 导入客户端代码 (React Native/Web)

```typescript
import { ApiClient, ReactNativeAdapter } from '@smart-lock/shared/client';
```

### 导入服务端代码 (Node.js)

```typescript
import { db, connect } from '@smart-lock/shared/server';
```

## 代码结构

```
packages/shared/
├── src/
│   ├── shared/         # 所有平台共享代码
│   │   ├── types/      # 共享类型定义
│   │   ├── utils/      # 共享工具函数
│   │   └── common/     # 共享常量和枚举
│   │
│   ├── client/         # 客户端特定代码
│   │   └── ...
│   │
│   ├── server/         # 服务端特定代码
│   │   └── ...
│   │
│   └── index.ts        # 主入口文件
│
└── package.json        # 包配置
```

## 注意事项

1. 在React Native中不要直接导入服务端特定功能：
   ```typescript
   // 错误 - 会导致运行时错误
   import { db } from '@smart-lock/shared/server';

   // 正确
   import { api } from '@smart-lock/shared/client';
   ```

2. 如果需要条件性引入服务端代码，请使用平台检测工具：
   ```typescript
   import { isNode } from '@smart-lock/shared';

   if (isNode()) {
     // 动态导入服务端代码
     import('@smart-lock/shared/server').then(({ db }) => {
       // 使用数据库
     });
   }
   ```