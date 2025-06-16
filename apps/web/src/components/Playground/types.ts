export interface ChatMessage {
	id: string;
	type: 'user' | 'agent' | 'system';
	content: string;
	timestamp: Date;
}

// Re-export types from dialog components
export type {
	PersonaFormData,
	AgeGroup,
	DigitalSkillLevel,
	BehaviorTrait,
} from './Dialogs/CreatePersonaDialog/types';
export type {
	ApplicationFormData,
	ApplicationEnvVar,
	ApplicationHeader,
} from './Dialogs/CreateApplicationDialog/types';

export interface SimulationFormData {
	personaId: string;
	applicationId: string;
	task: string;
}

export type PanelLayout = 'chat-left' | 'chat-right' | 'chat-full' | 'stream-full';

export interface PlaygroundStore {
	messages: ChatMessage[];
	currentSimulation: any;
	isRunning: boolean;
	streamUrl: string;
	panelLayout: PanelLayout;
	sidebarCollapsed: boolean;
}
