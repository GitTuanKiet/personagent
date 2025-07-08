import type {
	PersonaAgeGroup,
	PersonaDigitalSkillLevel,
	PersonaBehaviorTrait,
	CreatePersonaData,
} from '@/types';

export const DEFAULT_ASSISTANT_DATA: CreatePersonaData = {
	name: '',
	description: '',
	iconData: {
		iconName: 'User',
		iconColor: '#000000',
	},
	ageGroup: undefined,
	digitalSkillLevel: undefined,
	behaviorTraits: [],
	preferences: {},
	language: 'vietnamese',
};

export const AGE_GROUPS: { value: PersonaAgeGroup; label: string }[] = [
	{ value: 'teen', label: 'Teen (13-19)' },
	{ value: 'adult', label: 'Adult (20-64)' },
	{ value: 'senior', label: 'Senior (65+)' },
];

export const SKILL_LEVELS: { value: PersonaDigitalSkillLevel; label: string }[] = [
	{ value: 'low', label: 'Low - Basic digital literacy' },
	{ value: 'medium', label: 'Medium - Comfortable with technology' },
	{ value: 'high', label: 'High - Tech-savvy user' },
];

export const BEHAVIOR_TRAITS: PersonaBehaviorTrait[] = [
	'cautious',
	'impatient',
	'detail-oriented',
	'exploratory',
	'task-focused',
	'distracted',
	'hesitatesWithForms',
	'ignoresSmallText',
	'scrollAverse',
	'prefersTextOverIcon',
];

export const SAMPLE_ASSISTANTS: CreatePersonaData[] = [
	{
		name: 'Tech-Savvy Millennial',
		description:
			'A young professional comfortable with technology and expects efficient, modern interfaces',
		ageGroup: 'adult',
		digitalSkillLevel: 'high',
		behaviorTraits: ['impatient', 'task-focused', 'exploratory'],
		preferences: {
			theme: 'dark',
			animations: 'enabled',
			shortcuts: 'preferred',
			language: 'en',
		},
		language: 'english',
		iconData: {
			iconName: 'User',
			iconColor: '#000000',
		},
	},
	{
		name: 'Cautious Senior User',
		description: 'An older user who prefers clear instructions and is cautious with new technology',
		ageGroup: 'senior',
		digitalSkillLevel: 'low',
		behaviorTraits: ['cautious', 'detail-oriented', 'hesitatesWithForms', 'prefersTextOverIcon'],
		preferences: {
			fontSize: 'large',
			contrast: 'high',
			animations: 'minimal',
			confirmations: 'enabled',
		},
		language: 'english',
		iconData: {
			iconName: 'User',
			iconColor: '#000000',
		},
	},
	{
		name: 'Mobile-First Teen',
		description:
			'A teenager who primarily uses mobile devices and expects intuitive, gesture-based interactions',
		ageGroup: 'teen',
		digitalSkillLevel: 'high',
		behaviorTraits: ['impatient', 'exploratory', 'scrollAverse'],
		preferences: {
			device: 'mobile',
			gestures: 'enabled',
			socialSharing: 'important',
			notifications: 'frequent',
		},
		language: 'english',
		iconData: {
			iconName: 'User',
			iconColor: '#000000',
		},
	},
	{
		name: 'Busy Parent',
		description: 'A distracted user who needs to complete tasks quickly while multitasking',
		ageGroup: 'adult',
		digitalSkillLevel: 'medium',
		behaviorTraits: ['distracted', 'impatient', 'task-focused'],
		preferences: {
			autoSave: 'essential',
			quickActions: 'preferred',
			reminders: 'helpful',
			simplicity: 'valued',
		},
		language: 'english',
		iconData: {
			iconName: 'User',
			iconColor: '#000000',
		},
	},
];
