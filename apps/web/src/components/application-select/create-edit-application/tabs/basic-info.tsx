import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { TighterText } from '@/components/ui/tighter-text';
import type { CreateApplicationData } from '../constants';

interface BasicInfoTabProps {
	allDisabled: boolean;
}

export function BasicInfoTab({ allDisabled }: BasicInfoTabProps) {
	const form = useFormContext<CreateApplicationData>();

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
							<Input disabled={allDisabled} placeholder="Application name" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="url"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText>
								URL <span className="text-red-500">*</span>
							</TighterText>
						</FormLabel>
						<FormControl>
							<Input disabled={allDisabled} placeholder="https://example.com" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
