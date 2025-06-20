'use client';

import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { TIMEOUT_OPTIONS, RECURSION_LIMIT_OPTIONS } from './constants';
import type { ApplicationFormData } from './types';

export function ConfigurationTab() {
	const form = useFormContext<ApplicationFormData>();

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<FormField
					control={form.control}
					name="timeout"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Timeout</FormLabel>
							<Select
								value={field.value.toString()}
								onValueChange={(value) => field.onChange(parseInt(value))}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select timeout" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{TIMEOUT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value.toString()}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="recursionLimit"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Recursion Limit</FormLabel>
							<Select
								value={field.value.toString()}
								onValueChange={(value) => field.onChange(parseInt(value))}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select recursion limit" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{RECURSION_LIMIT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value.toString()}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="useVision"
				render={({ field }) => (
					<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<FormLabel className="text-base">Use Vision</FormLabel>
							<FormDescription>
								Enable AI vision capabilities for visual elements recognition
							</FormDescription>
						</div>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
		</div>
	);
}
