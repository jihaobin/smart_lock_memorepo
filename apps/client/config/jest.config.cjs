module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  globals: { __DEV__: true },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
