import { join } from 'node:path';

export function getUserDataDir(user?: string) {
	const homeVarName = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
	const userHome = process.env.USER_DATA_DIR ?? process.env[homeVarName] ?? process.cwd();

	return join(userHome, '.browser', user ?? '');
}
