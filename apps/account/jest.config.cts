import type { Config } from 'jest';

const config: Config = {
  displayName: 'account',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transformIgnorePatterns: ['/node_modules/(?!promise-breaker/)'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@platform/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
    '^@platform/shared$': '<rootDir>/../../libs/shared/src/index.ts',
  },
  coverageDirectory: '../../coverage/apps/account',
};

export = config;
