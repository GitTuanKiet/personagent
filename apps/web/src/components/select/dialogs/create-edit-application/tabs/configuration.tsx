'use client';

import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { Input } from '@workspace/ui/components/input';
import type { CreateApplicationData } from '@/types';

interface ConfigurationTabProps {
	allDisabled?: boolean;
}

export function ConfigurationTab({ allDisabled = false }: ConfigurationTabProps) {
	const form = useFormContext<CreateApplicationData>();

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="useVision"
				render={({ field }) => (
					<FormItem className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<FormLabel className="text-base">Vision Mode</FormLabel>
							<div className="text-sm text-muted-foreground">
								Enable visual analysis capabilities for better UI understanding
							</div>
						</div>
						<FormControl>
							<Switch
								checked={field.value}
								onCheckedChange={field.onChange}
								disabled={allDisabled}
							/>
						</FormControl>
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="recursionLimit"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Recursion Limit</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={1}
								max={1000}
								value={field.value}
								onChange={(e) => field.onChange(Number(e.target.value))}
								disabled={allDisabled}
							/>
						</FormControl>
						<div className="text-sm text-muted-foreground">
							Maximum number of actions the agent can perform (1-1000)
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
