// Minimal JavaScript baseline. Add typescript-eslint when source apps are scaffolded.
module.exports = [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**'] },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { module: 'readonly', require: 'readonly', process: 'readonly' },
    },
    rules: { 'no-unused-vars': 'error', 'no-undef': 'error' },
  },
];
