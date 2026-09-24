/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    // jose 6 ships ECMAScript modules only; compile just that package for Jest.
    '^.+\.js$': ['ts-jest', { tsconfig: { allowJs: true, module: 'commonjs', target: 'es2022' }, isolatedModules: true }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(\.pnpm/jose@[^/]+/node_modules/)?jose/)'],
};
