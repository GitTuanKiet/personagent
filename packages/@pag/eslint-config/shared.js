import tseslint from 'typescript-eslint';

/**
 * @type {(tsconfigRootDir: string) => import('eslint').Linter.Config[]}
 */
export default (tsconfigRootDir) => [
	{
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir,
			},
		},
		settings: {
			'import/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx'],
			},
			'import/resolver': {
				typescript: {
					tsconfigRootDir,
					project: './tsconfig.json',
				},
			},
		},
	},
];
