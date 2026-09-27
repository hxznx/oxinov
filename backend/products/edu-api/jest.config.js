/** @type {import('jest').Config} */
const base = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    // jose 6 ships ECMAScript modules only; Jest runs CommonJS, so compile just that package.
    '^.+\\.js$': [
      'ts-jest',
      { tsconfig: { allowJs: true, module: 'commonjs', target: 'es2022' }, isolatedModules: true },
    ],
  },
  // Keep node_modules untransformed except jose (pnpm stores it under node_modules/.pnpm/jose@x/node_modules/jose).
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/jose@[^/]+/node_modules/)?jose/)'],
};

module.exports = {
  // Integration suites reset and re-seed PostgreSQL in beforeAll; allow for slow CI machines.
  // Jest reads this option only at the top level, not inside a project.
  testTimeout: 60_000,
  projects: [
    { ...base, displayName: 'unit', testMatch: ['<rootDir>/src/**/*.spec.ts'] },
    {
      ...base,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      setupFiles: ['<rootDir>/test/setup-env.ts'],
    },
  ],
};
