// utils/nativewind-interop.ts
import { Motion } from '@legendapp/motion';
import { cssInterop } from 'nativewind';

// 配置其他可能需要的第三方组件
cssInterop(Motion.View, {
  className: {
    target: 'style',
  },
});

cssInterop(Motion.Text, {
  className: {
    target: 'style',
  },
});

cssInterop(Motion.Pressable, {
  className: {
    target: 'style',
  },
});

cssInterop(Motion.ScrollView, {
  className: {
    target: 'style',
  },
});

cssInterop(Motion.SectionList, {
  className: {
    target: 'style',
  },
});

cssInterop(Motion.FlatList, {
  className: {
    target: 'style',
  },
});

cssInterop(Motion.Image, {
  className: {
    target: 'style',
  },
});
