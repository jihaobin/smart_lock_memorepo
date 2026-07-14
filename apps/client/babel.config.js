module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
      'nativewind/babel',
    ],

    plugins: [
      '@babel/plugin-transform-class-static-block',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            'tailwind.config': './tailwind.config.js',
            '@smart-lock/env': '../../packages/env/dist',
            '@smart-lock/env/client': '../../packages/env/dist/client',
            '@smart-lock/shared': '../../packages/shared/dist',
            '@smart-lock/shared/client': '../../packages/shared/dist/client',
            'expo-router': '../../node_modules/expo-router',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
