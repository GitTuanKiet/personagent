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
import { Plus, Trash2 } from 'lucide-react';
import { TighterText } from '@/components/ui/tighter-text';
import type { CreatePersonaData } from '@/types';

interface PreferencesTabProps {
	allDisabled: boolean;
}

interface KeyValuePair {
	key: string;
	value: string;
}

export function PreferencesTab({ allDisabled }: PreferencesTabProps) {
	const form = useFormContext<CreatePersonaData>();
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');

	const preferences = form.watch('preferences') || {};
	const preferenceEntries: KeyValuePair[] = Object.entries(preferences).map(([key, value]) => ({
		key,
		value: String(value),
	}));

	const addPreference = () => {
		if (newKey.trim() && newValue.trim() && !preferences[newKey.trim()]) {
			const currentPrefs = form.getValues('preferences') || {};
			form.setValue('preferences', {
				...currentPrefs,
				[newKey.trim()]: newValue.trim(),
			});
			setNewKey('');
			setNewValue('');
		}
	};

	const removePreference = (keyToRemove: string) => {
		const currentPrefs = form.getValues('preferences') || {};
		const { [keyToRemove]: removed, ...remaining } = currentPrefs;
		form.setValue('preferences', remaining);
	};

	const updatePreference = (oldKey: string, newKey: string, newValue: string) => {
		if (!newKey.trim() || !newValue.trim()) return;

		const currentPrefs = form.getValues('preferences') || {};
		const updatedPrefs = { ...currentPrefs };

		if (oldKey !== newKey) {
			delete updatedPrefs[oldKey];
		}

		updatedPrefs[newKey.trim()] = newValue.trim();
		form.setValue('preferences', updatedPrefs);
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="preferences"
				render={() => (
					<FormItem>
						<FormLabel>
							<TighterText>Assistant Preferences</TighterText>
						</FormLabel>
						<FormDescription>
							<TighterText className="text-sm text-gray-600">
								Define custom preferences and settings for this assistant
							</TighterText>
						</FormDescription>

						<div className="space-y-4 pt-2">
							{/* Add new preference */}
							<div className="pt-4">
								<div className="flex gap-2 items-end">
									<div className="flex-1">
										<TighterText className="text-sm font-medium mb-2">Key</TighterText>
										<Input
											disabled={allDisabled}
											placeholder="e.g., theme, language"
											value={newKey}
											onChange={(e) => setNewKey(e.target.value)}
										/>
									</div>
									<div className="flex-1">
										<TighterText className="text-sm font-medium mb-2">Value</TighterText>
										<Input
											disabled={allDisabled}
											placeholder="e.g., dark, english"
											value={newValue}
											onChange={(e) => setNewValue(e.target.value)}
											onKeyPress={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addPreference();
												}
											}}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={
											allDisabled ||
											!newKey.trim() ||
											!newValue.trim() ||
											preferences[newKey.trim()]
										}
										onClick={addPreference}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* Existing preferences */}
							{preferenceEntries.length > 0 && (
								<div className="space-y-1">
									<TighterText className="text-sm font-medium">Current Preferences</TighterText>
									{preferenceEntries.map(({ key, value }, index) => (
										<PreferenceItem
											key={`${key}-${index}`}
											keyValue={key}
											value={value}
											allDisabled={allDisabled}
											onUpdate={(newKey, newValue) => updatePreference(key, newKey, newValue)}
											onRemove={() => removePreference(key)}
										/>
									))}
								</div>
							)}
						</div>

						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}

interface PreferenceItemProps {
	keyValue: string;
	value: string;
	allDisabled: boolean;
	onUpdate: (key: string, value: string) => void;
	onRemove: () => void;
}

function PreferenceItem({ keyValue, value, allDisabled, onUpdate, onRemove }: PreferenceItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editKey, setEditKey] = useState(keyValue);
	const [editValue, setEditValue] = useState(value);

	const handleSave = () => {
		if (editKey.trim() && editValue.trim()) {
			onUpdate(editKey.trim(), editValue.trim());
			setIsEditing(false);
		}
	};

	const handleCancel = () => {
		setEditKey(keyValue);
		setEditValue(value);
		setIsEditing(false);
	};

	return (
		<div className="pt-4">
			<div className="flex gap-2 items-end">
				<div className="flex-1">
					<Input
						disabled={allDisabled || !isEditing}
						value={editKey}
						onChange={(e) => setEditKey(e.target.value)}
						placeholder="Key"
					/>
				</div>
				<div className="flex-1">
					<Input
						disabled={allDisabled || !isEditing}
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						placeholder="Value"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleSave();
							}
						}}
					/>
				</div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={allDisabled}
					onClick={isEditing ? handleSave : () => setIsEditing(true)}
				>
					{isEditing ? 'Save' : 'Edit'}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					disabled={allDisabled}
					onClick={isEditing ? handleCancel : onRemove}
				>
					{isEditing ? 'Cancel' : 'Remove'}
				</Button>
			</div>
		</div>
	);
}
