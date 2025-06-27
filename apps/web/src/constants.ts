import type { Persona } from './types';

export const LANGGRAPH_API_URL = process.env.LANGGRAPH_API_URL ?? 'http://localhost:2024';

export const ASSISTANT_ID_COOKIE = 'oc_assistant_id';

export const CHAT_COLLAPSED_QUERY_PARAM = 'chatCollapsed';

export const DEFAULT_PERSONA: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'> = {
	iconData: {
		iconName: 'User',
		iconColor: '#000000',
	},
	name: 'Normal persona',
	description: 'A normal persona with no special behavior',
	ageGroup: 'adult',
	digitalSkillLevel: 'medium',
	behaviorTraits: [],
	preferences: {},
	language: 'english',
	isDefault: false,
};

export const DEFAULT_GRAPH_ID = 'agent';
