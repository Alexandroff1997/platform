module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!promise-breaker/|@nestjs/(config|passport)/)',
  ],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@platform/auth$': '<rootDir>/../../libs/auth/src/index.ts',
    '^@platform/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
    '^@platform/shared$': '<rootDir>/../../libs/shared/src/index.ts',
  },
  coverageDirectory: '../../coverage/apps/api',
};
