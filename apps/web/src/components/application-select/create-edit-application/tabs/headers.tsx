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
import type { CreateApplicationData } from '../constants';

interface HeadersTabProps {
	allDisabled: boolean;
}

interface KeyValuePair {
	key: string;
	value: string;
}

export function HeadersTab({ allDisabled }: HeadersTabProps) {
	const form = useFormContext<CreateApplicationData>();
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');

	const headers = form.watch('headers') || {};
	const headerEntries: KeyValuePair[] = Object.entries(headers).map(([key, value]) => ({
		key,
		value: String(value),
	}));

	const addHeader = () => {
		if (newKey.trim() && newValue.trim() && !headers[newKey.trim()]) {
			const current = form.getValues('headers') || {};
			form.setValue('headers', {
				...current,
				[newKey.trim()]: newValue.trim(),
			});
			setNewKey('');
			setNewValue('');
		}
	};

	const removeHeader = (keyToRemove: string) => {
		const current = form.getValues('headers') || {};
		const { [keyToRemove]: removed, ...remaining } = current;
		form.setValue('headers', remaining);
	};

	const updateHeader = (oldKey: string, newKey: string, newValue: string) => {
		if (!newKey.trim() || !newValue.trim()) return;
		const current = form.getValues('headers') || {};
		const updated = { ...current };
		if (oldKey !== newKey) {
			delete updated[oldKey];
		}
		updated[newKey.trim()] = newValue.trim();
		form.setValue('headers', updated);
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="headers"
				render={() => (
					<FormItem>
						<FormLabel>
							<TighterText>HTTP Headers</TighterText>
						</FormLabel>
						<FormDescription>
							<TighterText className="text-sm text-gray-600">
								Add custom request headers that should be sent with each request.
							</TighterText>
						</FormDescription>

						<div className="space-y-4 pt-2">
							{/* Add New Header */}
							<div className="pt-4">
								<div className="flex gap-2 items-end">
									<div className="flex-1">
										<TighterText className="text-sm font-medium mb-2">Key</TighterText>
										<Input
											disabled={allDisabled}
											placeholder="Authorization"
											value={newKey}
											onChange={(e) => setNewKey(e.target.value)}
										/>
									</div>
									<div className="flex-1">
										<TighterText className="text-sm font-medium mb-2">Value</TighterText>
										<Input
											disabled={allDisabled}
											placeholder="Bearer ..."
											value={newValue}
											onChange={(e) => setNewValue(e.target.value)}
											onKeyPress={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addHeader();
												}
											}}
										/>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={
											allDisabled || !newKey.trim() || !newValue.trim() || headers[newKey.trim()]
										}
										onClick={addHeader}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* Existing Headers */}
							{headerEntries.length > 0 && (
								<div className="space-y-1">
									<TighterText className="text-sm font-medium">Current Headers</TighterText>
									{headerEntries.map(({ key, value }, idx) => (
										<HeaderItem
											key={`${key}-${idx}`}
											headerKey={key}
											value={value}
											allDisabled={allDisabled}
											onUpdate={(newK, newV) => updateHeader(key, newK, newV)}
											onRemove={() => removeHeader(key)}
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

interface HeaderItemProps {
	headerKey: string;
	value: string;
	allDisabled: boolean;
	onUpdate: (key: string, value: string) => void;
	onRemove: () => void;
}

function HeaderItem({ headerKey, value, allDisabled, onUpdate, onRemove }: HeaderItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editKey, setEditKey] = useState(headerKey);
	const [editValue, setEditValue] = useState(value);

	const handleSave = () => {
		if (editKey.trim() && editValue.trim()) {
			onUpdate(editKey.trim(), editValue.trim());
			setIsEditing(false);
		}
	};

	const handleCancel = () => {
		setEditKey(headerKey);
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
					/>
				</div>
				{isEditing ? (
					<div className="flex gap-2">
						<Button type="button" size="icon" variant="outline" onClick={handleSave}>
							✓
						</Button>
						<Button type="button" size="icon" variant="outline" onClick={handleCancel}>
							✕
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Button type="button" size="icon" variant="outline" onClick={() => setIsEditing(true)}>
							✎
						</Button>
						<Button
							type="button"
							size="icon"
							variant="destructive"
							disabled={allDisabled}
							onClick={onRemove}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
