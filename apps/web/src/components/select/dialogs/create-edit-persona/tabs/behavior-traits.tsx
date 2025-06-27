import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Plus, X } from 'lucide-react';
import { TighterText } from '@/components/ui/header';
import { BEHAVIOR_TRAITS } from '../constants';
import type { CreatePersonaData } from '@/types';

interface BehaviorTraitsTabProps {
	allDisabled: boolean;
}

export function BehaviorTraitsTab({ allDisabled }: BehaviorTraitsTabProps) {
	const form = useFormContext<CreatePersonaData>();
	const [customTrait, setCustomTrait] = useState('');

	const selectedTraits = form.watch('behaviorTraits', []);

	const handleTraitChange = (trait: string, checked: boolean) => {
		const currentTraits = form.getValues('behaviorTraits') || [];
		if (checked) {
			form.setValue('behaviorTraits', [...currentTraits, trait]);
		} else {
			form.setValue(
				'behaviorTraits',
				currentTraits.filter((t) => t !== trait),
			);
		}
	};

	const addCustomTrait = () => {
		if (customTrait.trim() && !selectedTraits.includes(customTrait.trim())) {
			form.setValue('behaviorTraits', [...selectedTraits, customTrait.trim()]);
			setCustomTrait('');
		}
	};

	const removeCustomTrait = (trait: string) => {
		form.setValue(
			'behaviorTraits',
			selectedTraits.filter((t) => t !== trait),
		);
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="behaviorTraits"
				render={() => (
					<FormItem>
						<FormLabel>
							<TighterText>Behavior Traits</TighterText>
						</FormLabel>
						<FormDescription>
							<TighterText className="text-sm text-gray-600">
								Select traits that describe how this assistant should behave and interact
							</TighterText>
						</FormDescription>

						<div className="flex flex-wrap gap-2">
							{BEHAVIOR_TRAITS.map((trait) => (
								<Button
									key={trait}
									type="button"
									variant={selectedTraits.includes(trait) ? 'default' : 'outline'}
									size="sm"
									onClick={() => handleTraitChange(trait, !selectedTraits.includes(trait))}
								>
									<TighterText>{trait}</TighterText>
								</Button>
							))}
						</div>

						<div className="space-y-2 pt-4">
							<TighterText className="text-sm font-medium">Custom Traits</TighterText>
							<div className="flex gap-2">
								<Input
									disabled={allDisabled}
									placeholder="Add custom trait..."
									value={customTrait}
									onChange={(e) => setCustomTrait(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addCustomTrait();
										}
									}}
								/>
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={allDisabled || !customTrait.trim()}
									onClick={addCustomTrait}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{selectedTraits.length > 0 && (
							<div className="space-y-2 pt-2">
								<TighterText className="text-sm font-medium">Selected Traits</TighterText>
								<div className="flex flex-wrap gap-2">
									{selectedTraits.map((trait) => (
										<Badge key={trait} variant="secondary" className="flex items-center gap-1">
											<TighterText className="capitalize">
												{trait.replace(/([A-Z])/g, ' $1').toLowerCase()}
											</TighterText>
											<button type="button" onClick={() => removeCustomTrait(trait)}>
												<X className="h-3 w-3 cursor-pointer hover:text-destructive" />
											</button>
										</Badge>
									))}
								</div>
							</div>
						)}

						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
