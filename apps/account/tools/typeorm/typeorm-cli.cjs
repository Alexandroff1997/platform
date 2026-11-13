const path = require('path');

require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json'),
});

require('tsconfig-paths').register({
  baseUrl: __dirname,
  paths: {
    '@platform/shared': ['../../../../libs/shared/src/index.ts'],
  },
});

if (process.argv[2] === 'seed') {
  require('../../src/app/database/seeds/seed-user');
} else {
  require('typeorm/cli');
}
