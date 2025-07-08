import { useState } from 'react';
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
import { InlineContextTooltip } from '@/components/ui/inline-context-tooltip';
import { IconSelect } from '@/components/assistant-select/icon-select';
import { ColorPicker } from '@/components/assistant-select/color-picker';
import type { CreatePersonaData } from '@/types';
import type * as Icons from 'lucide-react';

interface AppearanceTabProps {
	allDisabled: boolean;
}

export function AppearanceTab({ allDisabled }: AppearanceTabProps) {
	const form = useFormContext<CreatePersonaData>();
	const [showColorPicker, setShowColorPicker] = useState(false);
	const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

	return (
		<div className="space-y-6">
			<div className="flex w-full items-start justify-between gap-4">
				<div className="flex flex-col gap-4 items-start justify-start w-full">
					<FormLabel htmlFor="icon">
						<TighterText className="flex items-center gap-2">
							Icon
							<InlineContextTooltip cardContentClassName="w-[300px]">
								<span className="text-sm text-gray-600">
									Choose an icon that represents your assistant's purpose or personality.
								</span>
							</InlineContextTooltip>
						</TighterText>
					</FormLabel>
					<FormField
						control={form.control}
						name="iconData.iconName"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<IconSelect
										allDisabled={allDisabled}
										iconColor={form.watch('iconData.iconColor')}
										selectedIcon={field.value as keyof typeof Icons}
										setSelectedIcon={(iconName) => field.onChange(iconName)}
										hasSelectedIcon={!!field.value}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex flex-col gap-4 items-start justify-start w-full">
					<FormLabel>
						<TighterText className="flex items-center gap-2">
							Color
							<InlineContextTooltip cardContentClassName="w-[300px]">
								<span className="text-sm text-gray-600">
									Customize the color of your assistant's icon. Use hex format (#000000).
								</span>
							</InlineContextTooltip>
						</TighterText>
					</FormLabel>
					<FormField
						control={form.control}
						name="iconData.iconColor"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<div className="flex gap-1 items-center justify-start w-full">
										<ColorPicker
											disabled={allDisabled}
											iconColor={field.value}
											setIconColor={field.onChange}
											showColorPicker={showColorPicker}
											setShowColorPicker={setShowColorPicker}
											hoverTimer={hoverTimer}
											setHoverTimer={setHoverTimer}
										/>
										<Input
											disabled={allDisabled}
											placeholder="#000000"
											value={field.value}
											onChange={(e) => {
												let value = e.target.value;
												if (!value.startsWith('#')) {
													value = '#' + value;
												}
												field.onChange(value);
											}}
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
}
