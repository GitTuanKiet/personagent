'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateApplicationData } from '@/types';

interface HeadersTabProps {
	allDisabled?: boolean;
}

export function HeadersTab({ allDisabled = false }: HeadersTabProps) {
	const form = useFormContext<CreateApplicationData>();
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');

	const headers = form.watch('browserProfile.extraHTTPHeaders') || {};
	const headerEntries = Object.entries(headers);

	const addHeader = () => {
		if (newKey.trim() && newValue.trim() && !headers[newKey.trim()]) {
			const currentHeaders = form.getValues('browserProfile.extraHTTPHeaders') || {};
			form.setValue('browserProfile.extraHTTPHeaders', {
				...currentHeaders,
				[newKey.trim()]: newValue.trim(),
			});
			setNewKey('');
			setNewValue('');
		}
	};

	const removeHeader = (keyToRemove: string) => {
		const currentHeaders = form.getValues('browserProfile.extraHTTPHeaders') || {};
		const { [keyToRemove]: removed, ...remaining } = currentHeaders;
		form.setValue('browserProfile.extraHTTPHeaders', remaining);
	};

	const updateHeader = (oldKey: string, newKey: string, newValue: string) => {
		if (!newKey.trim() || !newValue.trim()) return;

		const currentHeaders = form.getValues('browserProfile.extraHTTPHeaders') || {};
		const updatedHeaders = { ...currentHeaders };

		if (oldKey !== newKey) {
			delete updatedHeaders[oldKey];
		}

		updatedHeaders[newKey.trim()] = newValue.trim();
		form.setValue('browserProfile.extraHTTPHeaders', updatedHeaders);
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="browserProfile.extraHTTPHeaders"
				render={() => (
					<FormItem>
						<FormLabel>Extra HTTP Headers</FormLabel>
						<div className="space-y-3">
							{headerEntries.map(([key, value], index) => (
								<div key={index} className="flex gap-2 items-center">
									<Input
										placeholder="Header name"
										value={key}
										onChange={(e) => updateHeader(key, e.target.value, value as string)}
										className="flex-1"
										disabled={allDisabled}
									/>
									<Input
										placeholder="Header value"
										value={value as string}
										onChange={(e) => updateHeader(key, key, e.target.value)}
										className="flex-1"
										disabled={allDisabled}
									/>
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => removeHeader(key)}
										className="h-10 w-10 text-red-500 hover:text-red-600"
										disabled={allDisabled}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							))}

							<div className="flex gap-2 items-center pt-2 border-t">
								<Input
									placeholder="Header name"
									value={newKey}
									onChange={(e) => setNewKey(e.target.value)}
									className="flex-1"
									disabled={allDisabled}
								/>
								<Input
									placeholder="Header value"
									value={newValue}
									onChange={(e) => setNewValue(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addHeader();
										}
									}}
									className="flex-1"
									disabled={allDisabled}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={addHeader}
									disabled={
										allDisabled || !newKey.trim() || !newValue.trim() || !!headers[newKey.trim()]
									}
									className="h-10 w-10"
								>
									<Plus className="w-4 h-4" />
								</Button>
							</div>
						</div>
						<div className="text-sm text-muted-foreground">
							Additional HTTP headers to send with requests
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="rounded-lg border p-4 bg-muted/50">
				<h4 className="text-sm font-medium mb-2">Common Headers</h4>
				<div className="text-sm text-muted-foreground space-y-1">
					<div>
						<code>Authorization</code>: Bearer tokens or API keys
					</div>
					<div>
						<code>Accept-Language</code>: Preferred language
					</div>
					<div>
						<code>X-Custom-Header</code>: Custom application headers
					</div>
				</div>
			</div>
		</div>
	);
}
