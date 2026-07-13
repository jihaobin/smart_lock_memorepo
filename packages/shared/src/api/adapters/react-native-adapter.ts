import { PlatformAdapter } from './platform-adapter';
import { StorageAdapter } from '../storage/storage-interface';
import { IAsyncStorage, INavigation } from '../types/react-native';

/**
 * React Native存储适配器
 * 使用AsyncStorage实现StorageAdapter接口
 *
 * 注意：这里不直接导入AsyncStorage，而是通过依赖注入方式获取
 * 避免shared包直接依赖react-native特定的库
 */
export class ReactNativeStorageAdapter implements StorageAdapter {
  private asyncStorage: IAsyncStorage;

  constructor(asyncStorage: IAsyncStorage) {
    this.asyncStorage = asyncStorage;
  }

  async getItem(key: string): Promise<string | null> {
    return await this.asyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.asyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.asyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await this.asyncStorage.clear();
  }
}

/**
 * React Native平台适配器
 */
export class ReactNativeAdapter implements PlatformAdapter {
  platform = 'react-native' as const;
  private storage: StorageAdapter;
  private navigation?: INavigation;

  constructor(asyncStorage: IAsyncStorage, navigation?: INavigation) {
    this.storage = new ReactNativeStorageAdapter(asyncStorage);
    this.navigation = navigation;
  }

  getStorage(): StorageAdapter {
    return this.storage;
  }

  getNetworkConfig(): Record<string, unknown> {
    return {
      // React Native特定配置
      timeout: 15000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
  }

  redirectToLogin(loginPath: string): void {
    // React Native环境下的导航
    if (this.navigation) {
      this.navigation.navigate(loginPath);
    }
  }
}
