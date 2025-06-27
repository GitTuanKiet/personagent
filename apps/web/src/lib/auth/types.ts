import type { auth } from './index';

export type SessionUser = typeof auth.$Infer.Session;
export type User = SessionUser['user'];
