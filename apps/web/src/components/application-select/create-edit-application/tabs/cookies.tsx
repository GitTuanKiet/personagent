import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Textarea } from '@workspace/ui/components/textarea';
import { TighterText } from '@/components/ui/tighter-text';
import type { CreateApplicationData } from '../constants';

interface CookiesTabProps {
	allDisabled: boolean;
}

export function CookiesTab({ allDisabled }: CookiesTabProps) {
	const form = useFormContext<CreateApplicationData>();

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="cookies"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText>Cookies</TighterText>
						</FormLabel>
						<FormControl>
							<Textarea
								disabled={allDisabled}
								placeholder="sessionid=abc123; path=/; domain=example.com"
								rows={3}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
