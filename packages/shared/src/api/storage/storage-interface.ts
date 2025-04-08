/**
 * 存储适配器接口
 * 为不同平台提供统一的存储API
 */
export interface StorageAdapter {
    /**
     * 获取存储的数据
     * @param key 存储键
     * @returns 存储的值，如果不存在则返回null
     */
    getItem(key: string): Promise<string | null>;

    /**
     * 设置存储数据
     * @param key 存储键
     * @param value 要存储的值
     */
    setItem(key: string, value: string): Promise<void>;

    /**
     * 移除存储的数据
     * @param key 要移除的键
     */
    removeItem(key: string): Promise<void>;

    /**
     * 清除所有存储数据
     */
    clear(): Promise<void>;
  }