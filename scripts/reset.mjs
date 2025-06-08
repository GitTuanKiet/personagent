// Resets the repository by deleting all untracked files except for few exceptions.
import { $ } from 'bun';
import { createInterface } from 'node:readline'

process.env.FORCE_COLOR = '1';

const excludePatterns = ['/.vscode/', '/.idea/', '.env'];
const excludeFlags = excludePatterns.map((exclude) => ['-e', exclude]).flat();

const message = `This will delete all untracked files except for those matching the following patterns: ${excludePatterns.map((x) => `"${x}"`).join(', ')}.`;
await $`echo '${message}'`;

// const answer = await question('❓ Do you want to continue? (y/n) ');
const question = '❓ Do you want to continue? (y/n) ';
const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true,
});
const answer = await new Promise((resolve) => {
	rl.question(question, resolve);
});

if (!['y', 'Y', ''].includes(answer)) {
	$`echo 'Aborting...'`;
	process.exit(0);
}

await $`echo '🧹 Cleaning untracked files...'`;
await $`git clean -fxd ${excludeFlags}`;
// In case node_modules is not removed by git clean
await $`rm -rf node_modules`;

await $`echo '⏬ Running bun install...'`;
await $`bun install`;

await $`echo '🏗️ Running bun build...'`;
await $`bun build`;
