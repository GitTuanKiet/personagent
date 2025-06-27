'use client';

import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { IconSelect } from '@/components/select/base/icon-select';
import { ColorPicker } from '@/components/select/base/color-picker';
import type { CreateApplicationData } from '@/types';

interface BasicInfoTabProps {
	allDisabled?: boolean;
}

export function BasicInfoTab({ allDisabled = false }: BasicInfoTabProps) {
	const form = useFormContext<CreateApplicationData>();
	const [showColorPicker, setShowColorPicker] = useState(false);
	const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

	const iconColor = form.watch('iconData.iconColor') || '#3b82f6';
	const setIconColor = (color: string) => {
		form.setValue('iconData.iconColor', color);
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Application Name*</FormLabel>
						<FormControl>
							<Input placeholder="e.g. My E-commerce Site" disabled={allDisabled} {...field} />
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
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Brief description of your application..."
								rows={3}
								disabled={allDisabled}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="iconData.iconName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Icon</FormLabel>
							<FormControl>
								<IconSelect
									selectedIcon={field.value as any}
									setSelectedIcon={field.onChange}
									hasSelectedIcon={!!field.value}
									iconColor={iconColor}
									allDisabled={allDisabled}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="iconData.iconColor"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Icon Color</FormLabel>
							<FormControl>
								<ColorPicker
									disabled={allDisabled}
									iconColor={iconColor}
									setIconColor={setIconColor}
									showColorPicker={showColorPicker}
									setShowColorPicker={setShowColorPicker}
									hoverTimer={hoverTimer}
									setHoverTimer={setHoverTimer}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="iconData.emoji"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Emoji (Optional)</FormLabel>
						<FormControl>
							<Input placeholder="😊" maxLength={2} disabled={allDisabled} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
