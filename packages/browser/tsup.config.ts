import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	outDir: 'dist/cjs',
	format: 'cjs',
	splitting: false,
	sourcemap: false,
	clean: true,
	bundle: true,
	minifySyntax: true,
	minifyWhitespace: true,
	minifyIdentifiers: false,
	target: 'node22',
	external: ['bun', 'patchright'],
	dts: true,
	async onSuccess() {
		if (typeof Bun === 'undefined') {
			console.warn(
				'❌   You are running tsup in a non-Bun environment. This may cause issues with the build process.' +
					'\n\n' +
					'Please use Bun to run tsup. e.g. `bun --bun tsup`',
			);
			return;
		}
		const { $, build, file, sleep } = Bun;

		await Promise.all([
			build({
				entrypoints: ['src/index.ts'],
				outdir: './dist',
				minify: {
					whitespace: true,
					syntax: true,
					identifiers: false,
				},
				target: 'node',
				env: 'disable',
				packages: 'external',
			}),
			build({
				entrypoints: ['src/index.ts'],
				outdir: './dist/bun',
				minify: {
					whitespace: true,
					syntax: true,
					identifiers: false,
				},
				target: 'bun',
				env: 'disable',
				packages: 'external',
			}),
		]);

		let count = 0;

		while (!(await file('dist/cjs/index.d.ts').exists())) {
			count++;
			const ms = 1000 * count;
			console.info(`ℹ️   Waiting for d.ts to be generated (${ms}ms)...`);
			await sleep(ms);
			if (count > 5) {
				console.warn(
					`❌ Failed to generate d.ts after ${count} attempts. This may cause issues with the build process.` +
						'\n\n' +
						'Please check the build process and try again.',
				);
				break;
			}
		}

		await Promise.all([
			$`cp dist/cjs/index.d.ts dist`,
			$`cp dist/cjs/index.d.ts dist/bun`,
			$`mv dist/index.js dist/index.mjs`,
		]);
	},
});
