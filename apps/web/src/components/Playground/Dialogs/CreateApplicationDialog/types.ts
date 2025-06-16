export type { ApplicationFormData } from './schema';

export interface ApplicationEnvVar {
	key: string;
	value: string | number | boolean;
	type: 'string' | 'number' | 'boolean';
}

export interface ApplicationHeader {
	key: string;
	value: string;
}
