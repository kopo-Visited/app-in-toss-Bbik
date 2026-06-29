const path = require('path');

// Granite 공식 jest 설정 헬퍼(preset: react-native, setupFilesAfterEnv: jest.setup, testMatch: __tests__/**)
const config = require('@granite-js/react-native/jest').config({
  rootDir: __dirname,
  moduleNameMapper: {
    '@babel/runtime(.*)': `${path.dirname(require.resolve('@babel/runtime/package.json'))}$1`,
  },
});

module.exports = config;
