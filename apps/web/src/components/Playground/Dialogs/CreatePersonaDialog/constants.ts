import type { AgeGroup, DigitalSkillLevel, BehaviorTrait, PersonaFormData } from './types';

export const DEFAULT_PERSONA_DATA: PersonaFormData = {
	name: '',
	description: '',
	ageGroup: '',
	digitalSkillLevel: '',
	behaviorTraits: [],
	preferences: {},
	pinned: false,
};

export const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
	{ value: 'teen', label: 'Teen (13-19)' },
	{ value: 'adult', label: 'Adult (20-64)' },
	{ value: 'senior', label: 'Senior (65+)' },
];

export const SKILL_LEVELS: { value: DigitalSkillLevel; label: string }[] = [
	{ value: 'low', label: 'Low - Basic digital literacy' },
	{ value: 'medium', label: 'Medium - Comfortable with technology' },
	{ value: 'high', label: 'High - Tech-savvy user' },
];

export const BEHAVIOR_TRAITS: BehaviorTrait[] = [
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

export const SAMPLE_PERSONAS: PersonaFormData[] = [
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
		pinned: false,
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
		pinned: false,
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
		pinned: false,
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
		pinned: false,
	},
];
