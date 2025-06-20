import { useFormContext } from 'react-hook-form';
import {
	FormControl,
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
import { AGE_GROUPS, SKILL_LEVELS } from './constants';
import type { PersonaFormData } from './types';

export function DemographicsTab() {
	const form = useFormContext<PersonaFormData>();

	return (
		<div className="flex flex-row justify-around gap-6">
			<FormField
				control={form.control}
				name="ageGroup"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Age Group</FormLabel>
						<Select value={field.value} onValueChange={field.onChange}>
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
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="digitalSkillLevel"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Digital Skill Level</FormLabel>
						<Select value={field.value} onValueChange={field.onChange}>
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
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="language"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Language</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select language" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="english">English</SelectItem>
								<SelectItem value="vietnamese">Vietnamese</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
