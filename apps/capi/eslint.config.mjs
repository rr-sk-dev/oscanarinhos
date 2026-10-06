import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'prisma/generated/**', 'eslint.config.mjs'],
  },
  ...tsPlugin.configs['flat/recommended'],
  prettierRecommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // prisma-json-types-generator types JSON columns via `declare global { namespace PrismaJson }`
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },
];
