import type { ApplicationFormData } from './types';

export const DEFAULT_FORM_DATA: ApplicationFormData = {
	name: '',
	description: '',
	allowedDomains: [],
	headers: {},
	timeout: 30000,
	recursionLimit: 100,
	useVision: false,
	env: {},
	wssUrl: '',
	cdpUrl: '',
	pinned: false,
};

export const TIMEOUT_OPTIONS = [
	{ value: 10000, label: '10 seconds' },
	{ value: 30000, label: '30 seconds' },
	{ value: 60000, label: '1 minute' },
	{ value: 120000, label: '2 minutes' },
	{ value: 300000, label: '5 minutes' },
] as const;

export const RECURSION_LIMIT_OPTIONS = [
	{ value: 50, label: '50' },
	{ value: 100, label: '100' },
	{ value: 200, label: '200' },
	{ value: 500, label: '500' },
] as const;

export const ENV_VAR_TYPES = [
	{ value: 'string', label: 'String' },
	{ value: 'number', label: 'Number' },
	{ value: 'boolean', label: 'Boolean' },
] as const;
