import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@workspace/ui/components/card';
import { TemplateCardProps } from './types';

export function TemplateCard({ persona, onSelect }: TemplateCardProps) {
	return (
		<Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
			<CardHeader>
				<CardTitle className="text-base">{persona.name}</CardTitle>
				<CardDescription className="text-sm line-clamp-2">{persona.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex gap-2 text-sm">
					<Badge variant="outline">{persona.ageGroup}</Badge>
					<Badge variant="outline">{persona.digitalSkillLevel} skill</Badge>
				</div>
				<div className="flex flex-wrap gap-1">
					{persona.behaviorTraits.slice(0, 3).map((trait) => (
						<Badge key={trait} variant="secondary" className="text-xs">
							{trait}
						</Badge>
					))}
					{persona.behaviorTraits.length > 3 && (
						<Badge variant="secondary" className="text-xs">
							+{persona.behaviorTraits.length - 3} more
						</Badge>
					)}
				</div>
				<Button onClick={() => onSelect(persona)} variant="outline" className="w-full" size="sm">
					Use This Template
				</Button>
			</CardContent>
		</Card>
	);
}
