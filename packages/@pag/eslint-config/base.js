import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turbo from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import unusedImports from 'eslint-plugin-unused-imports';
import unicorn from 'eslint-plugin-unicorn';
import lodash from 'eslint-plugin-lodash';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default [
	{
		ignores: ['node_modules/**', 'dist/**', 'tsup.config.ts'],
	},
	js.configs.recommended,
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		plugins: {
			import: importPlugin,
			'@typescript-eslint': tsPlugin,
			'unused-imports': unusedImports,
			unicorn,
			lodash,
			turbo,
			onlyWarn,
		},
		rules: {
			// ----------------------------------
			//              ESLint
			// ----------------------------------
			/** https://eslint.org/docs/rules/id-denylist */
			'id-denylist': [
				'error',
				'err',
				'cb',
				'callback',
				'any',
				'Number',
				'number',
				'String',
				'string',
				'Boolean',
				'boolean',
				'Undefined',
				'undefined',
			],
			/** https://eslint.org/docs/latest/rules/no-void */
			'no-void': ['error', { allowAsStatement: true }],
			/** https://eslint.org/docs/latest/rules/indent */
			indent: 'off',
			/** https://eslint.org/docs/latest/rules/no-constant-binary-expression */
			'no-constant-binary-expression': 'error',
			/** https://eslint.org/docs/latest/rules/sort-imports */
			'sort-imports': 'off',
			// ----------------------------------
			//        @typescript-eslint
			// ----------------------------------
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/array-type.md */
			'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
			/** https://typescript-eslint.io/rules/await-thenable/ */
			'@typescript-eslint/await-thenable': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-ts-comment.md */
			'@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true }],
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-types.md */
			'@typescript-eslint/ban-types': [
				'error',
				{
					types: {
						Object: {
							message: 'Use object instead',
							fixWith: 'object',
						},
						String: {
							message: 'Use string instead',
							fixWith: 'string',
						},
						Boolean: {
							message: 'Use boolean instead',
							fixWith: 'boolean',
						},
						Number: {
							message: 'Use number instead',
							fixWith: 'number',
						},
						Symbol: {
							message: 'Use symbol instead',
							fixWith: 'symbol',
						},
						Function: {
							message: [
								'The `Function` type accepts any function-like value.',
								'It provides no type safety when calling the function, which can be a common source of bugs.',
								'It also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.',
								'If you are expecting the function to accept certain arguments, you should explicitly define the function shape.',
							].join('\n'),
						},
					},
					extendDefaults: false,
				},
			],
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md */
			'@typescript-eslint/consistent-type-assertions': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-imports.md */
			'@typescript-eslint/consistent-type-imports': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/member-delimiter-style.md */
			'@typescript-eslint/member-delimiter-style': [
				'error',
				{
					multiline: {
						delimiter: 'semi',
						requireLast: true,
					},
					singleline: {
						delimiter: 'semi',
						requireLast: false,
					},
				},
			],
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md */
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'default',
					format: ['camelCase'],
				},
				{
					selector: 'variable',
					format: ['camelCase', 'snake_case', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'allowSingleOrDouble',
					trailingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'property',
					format: ['camelCase', 'snake_case', 'UPPER_CASE'],
					leadingUnderscore: 'allowSingleOrDouble',
					trailingUnderscore: 'allowSingleOrDouble',
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
				{
					selector: ['method', 'function', 'parameter'],
					format: ['camelCase'],
					leadingUnderscore: 'allowSingleOrDouble',
				},
			],
			/** https://github.com/import-js/eslint-plugin-import/blob/HEAD/docs/rules/no-duplicates.md */
			'import/no-duplicates': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-invalid-void-type.md */
			'@typescript-eslint/no-invalid-void-type': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-promises.md */
			'@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
			/** https://github.com/typescript-eslint/typescript-eslint/blob/v4.30.0/packages/eslint-plugin/docs/rules/no-floating-promises.md */
			'@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
			/** https://github.com/typescript-eslint/typescript-eslint/blob/v4.33.0/packages/eslint-plugin/docs/rules/no-namespace.md */
			'@typescript-eslint/no-namespace': 'off',
			/** https://eslint.org/docs/1.0.0/rules/no-throw-literal */
			'@typescript-eslint/no-throw-literal': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-boolean-literal-compare.md */
			'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-qualifier.md */
			'@typescript-eslint/no-unnecessary-qualifier': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-expressions.md */
			'@typescript-eslint/no-unused-expressions': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-nullish-coalescing.md */
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-optional-chain.md */
			'@typescript-eslint/prefer-optional-chain': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/promise-function-async.md */
			'@typescript-eslint/promise-function-async': 'error',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/triple-slash-reference.md */
			'@typescript-eslint/triple-slash-reference': 'off',
			/** https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/naming-convention.md */
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase'],
				},
			],
			/** https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/return-await.md */
			'@typescript-eslint/return-await': ['error', 'always'],
			/** https://typescript-eslint.io/rules/explicit-member-accessibility/ */
			'@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
			// ----------------------------------
			//       eslint-plugin-import
			// ----------------------------------
			/** https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md */
			'import/no-cycle': ['error', { ignoreExternal: false, maxDepth: 3 }],
			/** https://github.com/import-js/eslint-plugin-import/blob/master/docs/rules/no-default-export.md */
			'import/no-default-export': 'error',
			/** https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-unresolved.md */
			'import/no-unresolved': ['error', { ignore: ['^virtual:'] }],
			/** https://github.com/import-js/eslint-plugin-import/blob/master/docs/rules/order.md */
			'import/order': [
				'error',
				{
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
					groups: [['builtin', 'external'], 'internal', ['parent', 'index', 'sibling'], 'object'],
					'newlines-between': 'always',
				},
			],
			// ----------------------------------
			//              ESLint overrides
			// ----------------------------------
			/** https://eslint.org/docs/rules/class-methods-use-this */
			'class-methods-use-this': 'off',
			/** https://eslint.org/docs/rules/eqeqeq */
			eqeqeq: 'error',
			/** https://eslint.org/docs/rules/no-plusplus */
			'no-plusplus': 'off',
			/** https://eslint.org/docs/rules/object-shorthand */
			'object-shorthand': 'error',
			/** https://eslint.org/docs/rules/prefer-const */
			'prefer-const': 'error',
			/** https://eslint.org/docs/rules/prefer-spread */
			'prefer-spread': 'error',
			// These are tuned off since we use `noUnusedLocals` and `noUnusedParameters` now
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			/** https://www.typescriptlang.org/docs/handbook/enums.html#const-enums */
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSEnumDeclaration:not([const=true])',
					message:
						'Do not declare raw enums as it leads to runtime overhead. Use const enum instead. See https://www.typescriptlang.org/docs/handbook/enums.html#const-enums',
				},
			],
			// ----------------------------------
			//              import
			// ----------------------------------
			/** https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/prefer-default-export.md */
			'import/prefer-default-export': 'off',
			// ----------------------------------
			//         no-unused-imports
			// ----------------------------------
			/** https://github.com/sweepline/eslint-plugin-unused-imports/blob/master/docs/rules/no-unused-imports.md */
			'unused-imports/no-unused-imports': process.env.NODE_ENV === 'development' ? 'warn' : 'error',
			// ----------------------------------
			//         unicorn
			// ----------------------------------
			/** https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-await.md */
			'unicorn/no-unnecessary-await': 'error',
			/** https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-promise-resolve-reject.md */
			'unicorn/no-useless-promise-resolve-reject': 'error',
			// ----------------------------------
			//         lodash
			// ----------------------------------
			/** https://github.com/wix-incubator/eslint-plugin-lodash/blob/master/docs/rules/path-style.md */
			'lodash/path-style': ['error', 'as-needed'],
		},
	},
	{
		files: ['test/**/*.ts', '**/__tests__/*.ts', '**/*.cy.ts'],
		rules: {
			// TODO: Remove these
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/naming-convention': 'off',
			'import/no-duplicates': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-loop-func': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-shadow': 'off',
			'@typescript-eslint/no-throw-literal': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-use-before-define': 'off',
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/prefer-optional-chain': 'off',
			'@typescript-eslint/restrict-plus-operands': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'id-denylist': 'off',
			'import/no-cycle': 'off',
			'import/no-default-export': 'off',
			'import/no-extraneous-dependencies': 'off',
			'prefer-const': 'off',
			'prefer-spread': 'off',
		},
	},
];
