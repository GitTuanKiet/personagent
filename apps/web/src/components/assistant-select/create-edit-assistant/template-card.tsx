import React from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { TighterText } from '@/components/ui/tighter-text';
import type { CreatePersonaData } from '@/types';
import { getIcon } from '../utils';

interface TemplateCardProps {
	assistant: CreatePersonaData;
	onSelect: (assistant: CreatePersonaData) => void;
}

export function TemplateCard({ assistant, onSelect }: TemplateCardProps) {
	return (
		<Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
			<CardHeader>
				<div className="flex items-center gap-3">
					<div
						className="p-2 rounded-lg border"
						style={{ backgroundColor: `${assistant.iconData?.iconColor}20` }}
					>
						{getIcon(assistant.iconData?.iconName)}
					</div>
					<div className="flex-1">
						<CardTitle className="text-base">
							<TighterText>{assistant.name}</TighterText>
						</CardTitle>
					</div>
				</div>
				<CardDescription>
					<TighterText className="text-sm text-gray-600 line-clamp-2">
						{assistant.description}
					</TighterText>
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3 flex flex-col justify-between h-full">
				<div className="flex gap-2">
					{assistant.ageGroup && (
						<Badge variant="outline">
							<TighterText>{assistant.ageGroup}</TighterText>
						</Badge>
					)}
					{assistant.language && (
						<Badge variant="outline">
							<TighterText>{assistant.language}</TighterText>
						</Badge>
					)}
					{assistant.digitalSkillLevel && (
						<Badge variant="outline">
							<TighterText>{assistant.digitalSkillLevel} skill</TighterText>
						</Badge>
					)}
				</div>
				<div className="flex flex-wrap gap-1">
					{assistant.behaviorTraits.slice(0, 2).map((trait) => (
						<Badge key={trait} variant="secondary" className="text-xs">
							<TighterText>{trait}</TighterText>
						</Badge>
					))}
					{assistant.behaviorTraits.length > 2 && (
						<Badge variant="secondary" className="text-xs">
							<TighterText>+{assistant.behaviorTraits.length - 2} more</TighterText>
						</Badge>
					)}
				</div>

				<CardFooter>
					<Button onClick={() => onSelect(assistant)} className="w-full" size="sm">
						<TighterText>Use Template</TighterText>
					</Button>
				</CardFooter>
			</CardContent>
		</Card>
	);
}
