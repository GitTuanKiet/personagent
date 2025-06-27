import { useFormContext } from 'react-hook-form';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { TighterText } from '@/components/ui/header';
import { AGE_GROUPS, SKILL_LEVELS } from '../constants';
import type { CreatePersonaData } from '@/types';

interface DemographicsTabProps {
	allDisabled: boolean;
}

export function DemographicsTab({ allDisabled }: DemographicsTabProps) {
	const form = useFormContext<CreatePersonaData>();

	return (
		<div className="space-y-6 md:flex md:justify-between">
			<FormField
				control={form.control}
				name="ageGroup"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText>Age Group</TighterText>
						</FormLabel>
						<Select
							disabled={allDisabled}
							onValueChange={field.onChange}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select age group" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{AGE_GROUPS.map((group) => (
									<SelectItem key={group.value} value={group.value}>
										{group.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormDescription>
							<TighterText className="text-sm text-gray-600">
								The age demographic this assistant is designed for
							</TighterText>
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="digitalSkillLevel"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							<TighterText>Digital Skill Level</TighterText>
						</FormLabel>
						<Select
							disabled={allDisabled}
							onValueChange={field.onChange}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select skill level" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{SKILL_LEVELS.map((level) => (
									<SelectItem key={level.value} value={level.value}>
										{level.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormDescription>
							<TighterText className="text-sm text-gray-600">
								The expected digital literacy level of users this assistant serves
							</TighterText>
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
