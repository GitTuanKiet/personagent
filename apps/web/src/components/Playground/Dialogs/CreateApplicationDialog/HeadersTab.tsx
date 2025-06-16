'use client';

import { useFormContext } from 'react-hook-form';
import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { XIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { ApplicationFormData, ApplicationHeader } from './types';

export function HeadersTab() {
	const form = useFormContext<ApplicationFormData>();
	const [newHeader, setNewHeader] = useState<ApplicationHeader>({ key: '', value: '' });

	const headers = form.watch('headers');

	const addHeader = () => {
		if (newHeader.key.trim() && newHeader.value.trim()) {
			form.setValue('headers', {
				...headers,
				[newHeader.key.trim()]: newHeader.value.trim(),
			});
			setNewHeader({ key: '', value: '' });
		}
	};

	const removeHeader = (key: string) => {
		const newHeaders = { ...headers };
		delete newHeaders[key];
		form.setValue('headers', newHeaders);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addHeader();
		}
	};

	const headerEntries = Object.entries(headers);

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="headers"
				render={() => (
					<FormItem>
						<FormLabel className="text-base font-medium">HTTP Headers</FormLabel>
						<FormDescription>
							Add custom HTTP headers that will be sent with each request
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<FormLabel htmlFor="headerKey">Header Name</FormLabel>
						<Input
							id="headerKey"
							placeholder="Authorization"
							value={newHeader.key}
							onChange={(e) => setNewHeader((prev) => ({ ...prev, key: e.target.value }))}
							onKeyPress={handleKeyPress}
						/>
					</div>
					<div className="space-y-2">
						<FormLabel htmlFor="headerValue">Header Value</FormLabel>
						<div className="flex gap-2">
							<Input
								id="headerValue"
								placeholder="Bearer token123"
								value={newHeader.value}
								onChange={(e) => setNewHeader((prev) => ({ ...prev, value: e.target.value }))}
								onKeyPress={handleKeyPress}
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addHeader}
								disabled={!newHeader.key.trim() || !newHeader.value.trim()}
							>
								<PlusIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				{headerEntries.length > 0 && (
					<div className="space-y-2">
						<FormLabel>Current Headers</FormLabel>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{headerEntries.map(([key, value]) => (
								<div
									key={key}
									className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												{key}
											</Badge>
											<span className="text-sm truncate">{value}</span>
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => removeHeader(key)}
									>
										<XIcon className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{headerEntries.length === 0 && (
					<div className="text-center py-8 text-muted-foreground">
						<p>No headers configured</p>
						<p className="text-sm">Add headers that will be sent with each request</p>
					</div>
				)}
			</div>
		</div>
	);
}
