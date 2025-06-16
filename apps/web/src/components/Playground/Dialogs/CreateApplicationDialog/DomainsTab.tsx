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
import { XIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { ApplicationFormData } from './types';

export function DomainsTab() {
	const form = useFormContext<ApplicationFormData>();
	const [newDomain, setNewDomain] = useState('');

	const allowedDomains = form.watch('allowedDomains');

	const addDomain = () => {
		if (newDomain.trim() && !allowedDomains.includes(newDomain.trim())) {
			form.setValue('allowedDomains', [...allowedDomains, newDomain.trim()]);
			setNewDomain('');
		}
	};

	const removeDomain = (domain: string) => {
		form.setValue(
			'allowedDomains',
			allowedDomains.filter((d) => d !== domain),
		);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addDomain();
		}
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="allowedDomains"
				render={() => (
					<FormItem>
						<FormLabel className="text-base font-medium">Allowed Domains</FormLabel>
						<FormDescription>
							Specify which domains the application can access. Leave empty to allow all domains.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-4">
				<div className="flex gap-2">
					<Input
						placeholder="https://example.com"
						value={newDomain}
						onChange={(e) => setNewDomain(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1"
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addDomain}
						disabled={!newDomain.trim()}
					>
						<PlusIcon className="h-4 w-4" />
					</Button>
				</div>

				{allowedDomains.length > 0 && (
					<div className="space-y-2">
						<FormLabel>Current Domains</FormLabel>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{allowedDomains.map((domain, index) => (
								<div
									key={`${domain}-${index}`}
									className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
								>
									<div className="flex-1 min-w-0">
										<span className="text-sm truncate">{domain}</span>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => removeDomain(domain)}
									>
										<XIcon className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{allowedDomains.length === 0 && (
					<div className="text-center py-8 text-muted-foreground">
						<p>No domain restrictions</p>
						<p className="text-sm">
							Application can access all domains when no restrictions are set
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
