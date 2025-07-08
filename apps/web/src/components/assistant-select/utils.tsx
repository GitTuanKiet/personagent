import { DEFAULT_GRAPH_ID } from '@/constants';
import type { Persona, CreatePersonaData } from '@/types';
import type { Assistant } from '@langchain/langgraph-sdk';
import * as Icons from 'lucide-react';
import React from 'react';

export const getIcon = (iconName?: string, fallbackIcon?: string) => {
	if (iconName && Icons[iconName as keyof typeof Icons]) {
		return React.createElement(Icons[iconName as keyof typeof Icons] as React.ElementType);
	}
	return fallbackIcon
		? React.createElement(Icons[fallbackIcon as keyof typeof Icons] as React.ElementType)
		: React.createElement(Icons.User);
};

export const assistantToPersona = (assistant: Assistant): Persona => {
	const data =
		assistant?.metadata ?? assistant?.config.configurable?.persona ?? ({} as CreatePersonaData);
	return {
		id: assistant.assistant_id,
		name: assistant.name,
		createdAt: new Date(assistant.created_at),
		updatedAt: new Date(assistant.updated_at),
		...(data as CreatePersonaData),
	};
};
