import { useState } from 'react';
import { UserIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { usePlaygroundStore } from '@/store/playground';

export function PersonaProfile() {
	const { getPinnedPersona } = usePlaygroundStore();
	const [showAllTraits, setShowAllTraits] = useState(false);
	const [showPreferences, setShowPreferences] = useState(false);
	const persona = getPinnedPersona();

	if (!persona) {
		return null;
	}

	const visibleTraits = showAllTraits
		? persona.behaviorTraits || []
		: (persona.behaviorTraits || []).slice(0, 4);

	const hasMoreTraits = (persona.behaviorTraits || []).length > 4;

	const Description = () => {
		if (!persona.description) {
			return null;
		}

		return (
			<div>
				<Label className="text-xs font-medium text-muted-foreground">Description</Label>
				<p className="text-xs mt-1 leading-relaxed">{persona.description}</p>
			</div>
		);
	};

	const Demographics = () => {
		if (!persona.ageGroup && !persona.digitalSkillLevel) {
			return null;
		}

		return (
			<div>
				<Label className="text-xs font-medium text-muted-foreground">Demographics</Label>
				<div className="flex gap-2 mt-1 flex-wrap">
					{persona.ageGroup && (
						<Badge variant="outline" className="text-xs">
							{persona.ageGroup === 'teen' && 'Teen (13-19)'}
							{persona.ageGroup === 'adult' && 'Adult (20-64)'}
							{persona.ageGroup === 'senior' && 'Senior (65+)'}
						</Badge>
					)}
					{persona.digitalSkillLevel && (
						<Badge variant="outline" className="text-xs">
							{persona.digitalSkillLevel === 'low' && 'Basic Skills'}
							{persona.digitalSkillLevel === 'medium' && 'Comfortable'}
							{persona.digitalSkillLevel === 'high' && 'Tech-Savvy'}
						</Badge>
					)}
				</div>
			</div>
		);
	};

	const BehaviorTraits = () => {
		if (!persona.behaviorTraits) {
			return null;
		}

		return (
			<div>
				<Label className="text-xs font-medium text-muted-foreground">Behavior Traits</Label>
				<div className="flex gap-1 mt-1 flex-wrap">
					{persona.behaviorTraits.map((trait) => (
						<Badge key={trait} variant="secondary" className="text-xs">
							{trait}
						</Badge>
					))}
				</div>
			</div>
		);
	};

	const Preferences = () => {
		if (!persona.preferences || Object.keys(persona.preferences).length === 0) {
			return null;
		}

		return (
			<div>
				<div className="flex items-center justify-between">
					<Label className="text-xs font-medium text-muted-foreground">
						Preferences ({Object.keys(persona.preferences).length})
					</Label>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowPreferences(!showPreferences)}
						className="h-auto p-1"
					>
						{showPreferences ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
					</Button>
				</div>

				{showPreferences && (
					<div className="mt-2 space-y-1">
						{Object.entries(persona.preferences).map(([key, value]) => (
							<div key={key} className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground font-medium">{key}:</span>
								<span className="text-right max-w-[60%] truncate">
									{typeof value === 'object' ? JSON.stringify(value) : String(value)}
								</span>
							</div>
						))}
					</div>
				)}

				{!showPreferences && (
					<div className="flex gap-1 mt-1 flex-wrap">
						{Object.keys(persona.preferences)
							.slice(0, 3)
							.map((key) => (
								<Badge key={key} variant="outline" className="text-xs">
									{key}
								</Badge>
							))}
						{Object.keys(persona.preferences).length > 3 && (
							<Badge variant="outline" className="text-xs">
								+{Object.keys(persona.preferences).length - 3} more
							</Badge>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="border-t p-4 space-y-4">
			{/* Header */}
			<div className="flex items-center gap-2">
				<UserIcon size={14} className="text-primary" />
				<h3 className="text-sm font-medium flex-1">{persona.name}</h3>
				<span className="text-primary text-xs">📌</span>
			</div>

			{/* Description */}
			<Description />

			{/* Demographics */}
			<Demographics />

			{/* Behavior Traits */}
			<BehaviorTraits />

			{/* Preferences */}
			<Preferences />
		</div>
	);
}
