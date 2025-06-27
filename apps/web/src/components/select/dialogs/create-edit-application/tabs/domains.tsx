'use client';

import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Textarea } from '@workspace/ui/components/textarea';
import type { CreateApplicationData } from '@/types';

interface DomainsTabProps {
	allDisabled?: boolean;
}

export function DomainsTab({ allDisabled = false }: DomainsTabProps) {
	const form = useFormContext<CreateApplicationData>();

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="browserProfile.allowedDomains"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Allowed Domains</FormLabel>
						<FormControl>
							<Textarea
								placeholder="https://example.com&#10;https://app.example.com&#10;(one URL per line)"
								rows={4}
								value={field.value?.join('\n') || ''}
								onChange={(e) => {
									const domains = e.target.value.split('\n').filter((domain) => domain.trim());
									field.onChange(domains);
								}}
								disabled={allDisabled}
							/>
						</FormControl>
						<div className="text-sm text-muted-foreground">
							Domains that the agent is allowed to navigate to. One URL per line.
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="browserProfile.blockedDomains"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Blocked Domains</FormLabel>
						<FormControl>
							<Textarea
								placeholder="https://blocked-site.com&#10;https://spam.example.com&#10;(one URL per line)"
								rows={3}
								value={field.value?.join('\n') || ''}
								onChange={(e) => {
									const domains = e.target.value.split('\n').filter((domain) => domain.trim());
									field.onChange(domains);
								}}
								disabled={allDisabled}
							/>
						</FormControl>
						<div className="text-sm text-muted-foreground">
							Domains that the agent should avoid. One URL per line.
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
