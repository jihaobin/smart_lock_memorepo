/**
 * AsyncStorage接口定义
 * 仅包含需要的方法
 */
export interface IAsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * 导航接口定义
 * 包含必要的导航方法
 * 设计为足够通用，可适配不同导航库
 */
export interface INavigation {
  /**
   * 导航到指定路由
   * @param routeName 路由名称或路径
   * @param params 可选参数
   */
  navigate(routeName: string, params?: Record<string, unknown>): void;

  /**
   * 返回上一页
   */
  goBack(): void;

  /**
   * 重置导航状态
   * @param state 导航状态
   */
  reset(state: {
    routes: Array<{
      name: string;
      params?: Record<string, unknown>;
    }>;
    index: number;
  }): void;
}