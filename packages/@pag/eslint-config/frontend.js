import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import tsPlugin from '@typescript-eslint/eslint-plugin';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default [
	{
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
			import: importPlugin,
			'@typescript-eslint': tsPlugin,
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				ecmaFeatures: { jsx: true },
				project: ['./tsconfig.json'],
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
			'import/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx'],
			},
			'import/resolver': {
				typescript: {
					project: './tsconfig.json',
				},
			},
		},
		rules: {
			// React rules
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			// TypeScript rules
			'@typescript-eslint/no-use-before-define': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unsafe-call': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			'@typescript-eslint/no-unsafe-return': 'error',
			'@typescript-eslint/restrict-template-expressions': 'error',
			'@typescript-eslint/unbound-method': 'error',
			'@typescript-eslint/no-unsafe-member-access': 'error',
			// General rules
			'no-console': 'warn',
			'no-debugger': process.env.CI === 'true' ? 'error' : 'off',
			semi: [2, 'always'],
			'comma-dangle': ['error', 'always-multiline'],
			'no-tabs': 0,
			'no-labels': 0,
			'import/no-extraneous-dependencies': 'warn',
		},
	},
	// Test file overrides
	{
		files: ['**/*.test.ts', '**/test/**/*.ts', '**/__tests__/**/*.ts', '**/*.stories.ts'],
		rules: {
			'import/no-extraneous-dependencies': 'off',
		},
	},
];
