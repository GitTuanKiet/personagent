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
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import type { PersonaFormData } from './types';

export function BasicInfoTab() {
	const form = useFormContext<PersonaFormData>();

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name *</FormLabel>
							<FormControl>
								<Input placeholder="Enter persona name..." {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="pinned"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center space-x-2 space-y-0">
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<FormLabel className="font-normal">Pin this persona</FormLabel>
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Textarea placeholder="Enter description..." rows={4} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
