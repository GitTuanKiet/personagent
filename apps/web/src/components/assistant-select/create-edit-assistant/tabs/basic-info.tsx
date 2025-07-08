import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { TighterText } from '@/components/ui/tighter-text';
import { InlineContextTooltip } from '@/components/ui/inline-context-tooltip';
import type { CreatePersonaData } from '@/types';

interface BasicInfoTabProps {
	allDisabled: boolean;
}

export function BasicInfoTab({ allDisabled }: BasicInfoTabProps) {
	const form = useFormContext<CreatePersonaData>();

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText>
								Name <span className="text-red-500">*</span>
							</TighterText>
						</FormLabel>
						<FormControl>
							<Input disabled={allDisabled} placeholder="Enter assistant name..." {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText className="flex items-center gap-2">
								Description
								<InlineContextTooltip cardContentClassName="w-[400px]">
									<span className="text-sm text-gray-600">
										Provide a brief description of your assistant's purpose and capabilities. This
										helps you remember what this assistant is designed for.
									</span>
								</InlineContextTooltip>
							</TighterText>
						</FormLabel>
						<FormControl>
							<Textarea
								disabled={allDisabled}
								placeholder="Assistant specialized for handling work emails, scheduling meetings, and managing professional communications..."
								rows={3}
								{...field}
								value={field.value ?? ''}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="language"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText>Language</TighterText>
						</FormLabel>
						<Select
							disabled={allDisabled}
							onValueChange={field.onChange}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select language" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="vietnamese">Vietnamese</SelectItem>
								<SelectItem value="english">English</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
