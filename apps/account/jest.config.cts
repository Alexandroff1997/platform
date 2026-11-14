import type { Config } from 'jest';

const config: Config = {
  displayName: 'account',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@platform/shared$': '<rootDir>/../../libs/shared/src/index.ts',
  },
  coverageDirectory: '../../coverage/apps/account',
};

export = config;
