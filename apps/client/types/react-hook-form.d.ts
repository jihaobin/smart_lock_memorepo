import { Controller as RHFController } from 'react-hook-form';

// 扩展React命名空间，使Controller可以作为JSX元素使用
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Controller: any;
    }
  }
}

// 重新导出控制器
export { RHFController as Controller };
