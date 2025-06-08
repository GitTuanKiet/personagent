import base from './base.js';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default [
	...base,
	{
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
		},
		linterOptions: {
			env: {
				es6: true,
				node: true,
			},
		},
	},
];
