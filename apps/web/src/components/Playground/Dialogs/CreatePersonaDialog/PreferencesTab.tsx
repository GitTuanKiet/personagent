import { useState, useEffect } from 'react';
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
import { PlusIcon, Trash2Icon } from 'lucide-react';
import type { PersonaFormData, KeyValuePair } from './types';

export function PreferencesTab() {
	const form = useFormContext<PersonaFormData>();
	const [preferencesPairs, setPreferencesPairs] = useState<KeyValuePair[]>([
		{ key: '', value: '' },
	]);

	const preferences = form.watch('preferences');

	// Initialize preferences pairs from form data
	useEffect(() => {
		if (preferences && Object.keys(preferences).length > 0) {
			const pairs = Object.entries(preferences).map(([key, value]) => ({
				key,
				value: String(value),
			}));
			setPreferencesPairs(pairs.length > 0 ? pairs : [{ key: '', value: '' }]);
		}
	}, []);

	// Update form whenever pairs change
	useEffect(() => {
		const preferencesObj: Record<string, any> = {};
		preferencesPairs.forEach((pair) => {
			if (pair.key.trim() && pair.value.trim()) {
				preferencesObj[pair.key.trim()] = pair.value.trim();
			}
		});
		form.setValue('preferences', preferencesObj);
	}, [preferencesPairs, form]);

	const addPreferencePair = () => {
		setPreferencesPairs([...preferencesPairs, { key: '', value: '' }]);
	};

	const removePreferencePair = (index: number) => {
		if (preferencesPairs.length > 1) {
			setPreferencesPairs(preferencesPairs.filter((_, i) => i !== index));
		}
	};

	const updatePreferencePair = (index: number, field: 'key' | 'value', value: string) => {
		const updated = preferencesPairs.map((pair, i) =>
			i === index ? { ...pair, [field]: value } : pair,
		);
		setPreferencesPairs(updated);
	};

	const getPreferencesFromPairs = () => {
		const preferencesObj: Record<string, any> = {};
		preferencesPairs.forEach((pair) => {
			if (pair.key.trim() && pair.value.trim()) {
				preferencesObj[pair.key.trim()] = pair.value.trim();
			}
		});
		return preferencesObj;
	};

	return (
		<FormField
			control={form.control}
			name="preferences"
			render={() => (
				<FormItem>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<FormLabel>User Preferences</FormLabel>
								<FormDescription>
									Define key-value pairs that represent user preferences and settings
								</FormDescription>
							</div>
							<Button type="button" variant="outline" size="sm" onClick={addPreferencePair}>
								<PlusIcon className="h-4 w-4 mr-1" />
								Add Preference
							</Button>
						</div>

						<div className="space-y-2">
							{preferencesPairs.map((pair, index) => (
								<div key={index} className="flex gap-2 items-center">
									<Input
										placeholder="Preference key (e.g., theme)"
										value={pair.key}
										onChange={(e) => updatePreferencePair(index, 'key', e.target.value)}
										className="flex-1"
									/>
									<Input
										placeholder="Value (e.g., dark)"
										value={pair.value}
										onChange={(e) => updatePreferencePair(index, 'value', e.target.value)}
										className="flex-1"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => removePreferencePair(index)}
										disabled={preferencesPairs.length <= 1}
									>
										<Trash2Icon className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>

						{preferencesPairs.some((pair) => pair.key && pair.value) && (
							<div className="mt-4 p-3 bg-muted rounded-md">
								<FormLabel className="text-sm font-medium">Preview:</FormLabel>
								<div className="mt-2 text-sm text-muted-foreground">
									{JSON.stringify(getPreferencesFromPairs(), null, 2)}
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
