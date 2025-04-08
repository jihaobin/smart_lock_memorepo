
```思考:文档结构设计
首先需要对API封装的核心功能和特点进行概述，然后详细介绍各个组件的使用方法，特别是错误处理机制，最后提供完整的使用示例。
```

# API 请求客户端使用文档

## 项目概述

这是一个跨平台的API请求客户端封装，提供了统一的接口来处理API请求、认证和错误处理。主要特点：

- 跨平台支持（React Native、浏览器等）
- 强大的错误处理机制
- 自动Token管理（包括刷新）
- TypeScript支持，完整类型定义
- 插件式设计，高度可定制

## 核心组件

### 1. ApiClient

API请求的核心类，提供基础HTTP方法：

```typescript
// 创建实例
const apiClient = new ApiClient({
  baseURL: 'https://api.example.com',
  platformAdapter: adapter, // 平台适配器
  errorHandler: errorHandler, // 可选的错误处理器
  timeout: 15000
});

// 基本用法
const data = await apiClient.get<UserType>('/users/me');
const result = await apiClient.post<ResultType>('/items', { name: '测试' });
const updated = await apiClient.put<ItemType>('/items/123', { status: 'active' });
const removed = await apiClient.delete<boolean>('/items/123');

// 分页请求
const paginated = await apiClient.getPage<ItemType>('/items', {
  page: 1,
  limit: 20,
  filter: 'active'
});
```

### 2. 平台适配器

用于处理平台特定的功能：

```typescript
// React Native 使用示例
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNativeAdapter } from '@your-package/shared/api';

const navigation = /* 获取导航实例 */;
const adapter = new ReactNativeAdapter(AsyncStorage, navigation);
```

### 3. 错误处理系统

提供了一套完整的错误处理机制：

```typescript
import {
  ReactNativeErrorHandler,
  ErrorCode,
  ErrorHandlingStrategy
} from '@your-package/shared/api';

// 创建错误处理器
const errorHandler = new ReactNativeErrorHandler({
  toaster: yourToasterImplementation, // 自定义Toast提示器
  logErrors: true,
  showErrorCodes: isDev, // 开发环境显示错误代码
  errorMessages: {
    // 自定义错误消息
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置'
  }
});

// 配置特定错误的处理策略
errorHandler.setStrategyForError(ErrorCode.UNAUTHORIZED, ErrorHandlingStrategy.CUSTOM);
errorHandler.setStrategyForError(ErrorCode.NETWORK_ERROR, ErrorHandlingStrategy.RETRY);

// 注册特殊错误处理逻辑
errorHandler.registerErrorListener((context) => {
  if (context.errorCode === ErrorCode.UNAUTHORIZED) {
    // 自定义未授权错误处理，例如跳转到登录页
  }
});
```

## 自定义错误处理

### 创建自定义Toast提示器

实现`IToaster`接口来创建自定义提示器：

```typescript
import { IToaster } from '@your-package/shared/api';

// 使用第三方UI库创建Toast提示器
class CustomToaster implements IToaster {
  showError(message: string, options?: Record<string, unknown>): void {
    YourToastLibrary.show({
      type: 'error',
      text: message,
      // 其他配置
    });
  }

  showWarning(message: string, options?: Record<string, unknown>): void {
    // 实现警告提示
  }

  showInfo(message: string, options?: Record<string, unknown>): void {
    // 实现信息提示
  }

  showSuccess(message: string, options?: Record<string, unknown>): void {
    // 实现成功提示
  }
}
```

### 错误处理策略

- `IGNORE`：忽略错误，继续执行
- `RETRY`：自动重试请求
- `THROW`：向上抛出错误，由上层处理
- `CUSTOM`：由自定义逻辑处理

## 完整使用示例

### React Native Expo 项目

```typescript
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import {
  ApiClient,
  ReactNativeAdapter,
  ReactNativeErrorHandler,
  IToaster,
  ErrorCode
} from '@your-package/shared/api';

// 创建Toast适配器
class ToastAdapter implements IToaster {
  showError(message: string): void {
    Toast.show({
      type: 'error',
      text1: '错误',
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
    });
  }

  // 实现其他方法...
}

// 创建API客户端
function useApiClient() {
  const navigation = useNavigation();

  useEffect(() => {
    // 创建平台适配器
    const adapter = new ReactNativeAdapter(AsyncStorage, navigation);

    // 创建Toast提示器
    const toaster = new ToastAdapter();

    // 创建错误处理器
    const errorHandler = new ReactNativeErrorHandler({
      toaster,
      logErrors: true,
      errorMessages: {
        [ErrorCode.UNAUTHORIZED]: '您的登录已过期，请重新登录',
        // 其他自定义错误消息...
      }
    });

    // 处理特定错误
    errorHandler.registerErrorListener((context) => {
      if (context.errorCode === ErrorCode.UNAUTHORIZED) {
        // 登录过期后跳转到登录页
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }]
          });
        }, 1500);
      }
    });

    // 创建API客户端
    const apiClient = new ApiClient({
      baseURL: 'https://api.example.com/v1',
      platformAdapter: adapter,
      errorHandler,
      timeout: 15000
    });

    // 全局保存API客户端，或使用Context Provider
    global.apiClient = apiClient;

    return () => {
      // 清理逻辑
    };
  }, [navigation]);

  return null;
}

// 在组件中使用
function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await global.apiClient.get('/users/me');
        setUser(userData);
      } catch (error) {
        // 大多数错误已由错误处理器处理
        console.log('Failed to load user:', error);
      }
    }

    loadUser();
  }, []);

  // 渲染用户界面...
}
```

## 最佳实践

1. **集中配置**：将API客户端配置集中在一个地方，使用工厂函数创建实例
2. **错误处理分层**：
   - 全局级别：使用错误处理器处理通用错误（网络问题、认证）
   - 业务级别：在业务逻辑中处理特定API的错误
3. **类型安全**：充分利用TypeScript类型系统，为所有API请求定义正确的响应类型
4. **按需扩展**：根据项目需求扩展错误处理策略和提示器功能

## 错误代码参考

| 错误代码 | 描述 |
|---------|------|
| `NETWORK_ERROR` | 网络连接失败 |
| `TIMEOUT_ERROR` | 请求超时 |
| `UNAUTHORIZED` | 认证失败或令牌过期 |
| `FORBIDDEN` | 没有访问权限 |
| `NOT_FOUND` | 资源不存在 |
| `INTERNAL_ERROR` | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 服务暂不可用 |

---

更多详细信息请参考代码注释和类型定义。
