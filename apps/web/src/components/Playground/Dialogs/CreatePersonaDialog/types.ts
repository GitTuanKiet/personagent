import type { PersonaInsert } from '@/database/client/schema';
import type { PersonaFormData } from './schema';

export type AgeGroup = 'teen' | 'adult' | 'senior';
export type DigitalSkillLevel = 'low' | 'medium' | 'high';
export type BehaviorTrait =
	| 'cautious'
	| 'impatient'
	| 'detail-oriented'
	| 'exploratory'
	| 'task-focused'
	| 'distracted'
	| 'hesitatesWithForms'
	| 'ignoresSmallText'
	| 'scrollAverse'
	| 'prefersTextOverIcon'
	| string;

export type { PersonaFormData } from './schema';

export interface KeyValuePair {
	key: string;
	value: string;
}

export interface TemplateCardProps {
	persona: PersonaFormData;
	onSelect: (persona: PersonaFormData) => void;
}

export interface TemplatesCarouselProps {
	templates: PersonaFormData[];
	onSelectTemplate: (template: PersonaFormData) => void;
}

export interface BasicInfoTabProps {
	// Props removed - will use form context
}

export interface DemographicsTabProps {
	// Props removed - will use form context
}

export interface BehaviorTraitsTabProps {
	// Props removed - will use form context
}

export interface PreferencesTabProps {
	// Props removed - will use form context
}

export interface CreatePersonaFormProps {
	initialData?: PersonaFormData;
	onClose: () => void;
	onSubmit: (data: PersonaInsert) => Promise<void>;
	isEditMode?: boolean;
}
