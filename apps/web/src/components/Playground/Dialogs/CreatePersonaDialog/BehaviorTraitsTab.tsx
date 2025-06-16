import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { XIcon } from 'lucide-react';
import { BEHAVIOR_TRAITS } from './constants';
import type { BehaviorTrait, PersonaFormData } from './types';

export function BehaviorTraitsTab() {
	const form = useFormContext<PersonaFormData>();
	const [newBehaviorTrait, setNewBehaviorTrait] = useState('');

	const behaviorTraits = form.watch('behaviorTraits');

	const handleAddBehaviorTrait = (trait: BehaviorTrait) => {
		if (!behaviorTraits.includes(trait)) {
			form.setValue('behaviorTraits', [...behaviorTraits, trait]);
		}
	};

	const handleRemoveBehaviorTrait = (trait: BehaviorTrait) => {
		form.setValue(
			'behaviorTraits',
			behaviorTraits.filter((t) => t !== trait),
		);
	};

	const handleAddCustomTrait = () => {
		if (newBehaviorTrait.trim() && !behaviorTraits.includes(newBehaviorTrait.trim())) {
			handleAddBehaviorTrait(newBehaviorTrait.trim());
			setNewBehaviorTrait('');
		}
	};

	return (
		<FormField
			control={form.control}
			name="behaviorTraits"
			render={() => (
				<FormItem>
					<div className="space-y-4">
						<div className="space-y-3">
							<FormLabel>Predefined Behavior Traits</FormLabel>
							<FormDescription>
								Select behavior traits that define how this persona interacts with interfaces
							</FormDescription>
							<div className="flex flex-wrap gap-2">
								{BEHAVIOR_TRAITS.map((trait) => (
									<Button
										key={trait}
										type="button"
										variant={behaviorTraits.includes(trait) ? 'default' : 'outline'}
										size="sm"
										onClick={() =>
											behaviorTraits.includes(trait)
												? handleRemoveBehaviorTrait(trait)
												: handleAddBehaviorTrait(trait)
										}
									>
										{trait}
									</Button>
								))}
							</div>
						</div>

						<div className="space-y-3">
							<FormLabel>Add Custom Trait</FormLabel>
							<div className="flex gap-2">
								<Input
									placeholder="Add custom trait..."
									value={newBehaviorTrait}
									onChange={(e) => setNewBehaviorTrait(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTrait()}
								/>
								<Button type="button" variant="outline" onClick={handleAddCustomTrait}>
									Add
								</Button>
							</div>
						</div>

						{behaviorTraits.length > 0 && (
							<div className="space-y-2">
								<FormLabel>Selected Traits:</FormLabel>
								<div className="flex flex-wrap gap-2">
									{behaviorTraits.map((trait) => (
										<Badge key={trait} variant="secondary" className="flex items-center gap-1">
											{trait}
											<button type="button" onClick={() => handleRemoveBehaviorTrait(trait)}>
												<XIcon className="h-3 w-3 cursor-pointer" />
											</button>
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
