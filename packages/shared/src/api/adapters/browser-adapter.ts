import { StorageAdapter } from '../storage/storage-interface';
import { PlatformAdapter } from './platform-adapter';

class BrowserStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

export class BrowserAdapter implements PlatformAdapter {
  platform = 'browser' as const;
  private storage: StorageAdapter = new BrowserStorageAdapter();

  getStorage(): StorageAdapter {
    return this.storage;
  }

  getNetworkConfig(): Record<string, unknown> {
    return { withCredentials: true };
  }

  redirectToLogin(loginPath: string): void {
    window.location.href = loginPath;
  }
}
