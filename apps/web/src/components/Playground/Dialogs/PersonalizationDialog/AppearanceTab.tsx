'use client';

import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { TypeIcon, MoonIcon, SunIcon, MonitorIcon, CheckIcon } from 'lucide-react';

import { useTheme, useUIPreferences } from '@/store/user/selectors';
import type { ThemeMode } from '@/store/user/types';

interface AppearanceTabProps {
	onSettingsChange: (hasChanges: boolean) => void;
}

export function AppearanceTab({ onSettingsChange }: AppearanceTabProps) {
	const { theme, setTheme } = useTheme();
	const { ui, updateUIPreferences } = useUIPreferences();

	const getThemeIcon = (themeMode: ThemeMode) => {
		switch (themeMode) {
			case 'light':
				return <SunIcon className="w-4 h-4" />;
			case 'dark':
				return <MoonIcon className="w-4 h-4" />;
			case 'system':
				return <MonitorIcon className="w-4 h-4" />;
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-muted/30 rounded-xl p-6">
				<div className="flex items-center gap-3 mb-4">
					<TypeIcon className="text-muted-foreground" size={18} />
					<h3 className="font-semibold text-lg">Theme & Appearance</h3>
				</div>

				{/* Theme Mode */}
				<div className="space-y-6">
					<div>
						<Label className="text-sm font-medium mb-3 block">Theme Mode</Label>
						<div className="grid grid-cols-3 gap-3">
							{(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
								<Button
									key={mode}
									variant="outline"
									size="lg"
									onClick={() => {
										setTheme(mode);
										onSettingsChange(true);
									}}
									className="justify-start gap-3 h-12 rounded-lg"
								>
									{getThemeIcon(mode)}
									<span className="capitalize font-medium">{mode}</span>
									{theme === mode && <CheckIcon className="w-4 h-4 text-primary ml-auto" />}
								</Button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div>
							<Label className="text-sm font-medium mb-3 block">Font Size</Label>
							<Select
								value={ui.fontSize}
								onValueChange={(value: 'small' | 'medium' | 'large') => {
									updateUIPreferences({ fontSize: value });
									onSettingsChange(true);
								}}
							>
								<SelectTrigger className="h-11 rounded-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="small">Small (14px)</SelectItem>
									<SelectItem value="medium">Medium (16px)</SelectItem>
									<SelectItem value="large">Large (18px)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-sm font-medium mb-3 block">Interface Density</Label>
							<Select
								value={ui.density}
								onValueChange={(value: 'compact' | 'comfortable' | 'spacious') => {
									updateUIPreferences({ density: value });
									onSettingsChange(true);
								}}
							>
								<SelectTrigger className="h-11 rounded-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compact">Compact</SelectItem>
									<SelectItem value="comfortable">Comfortable</SelectItem>
									<SelectItem value="spacious">Spacious</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex items-center justify-between p-4 bg-background rounded-lg border">
						<div>
							<Label className="text-sm font-medium">Enable Animations</Label>
							<p className="text-xs text-muted-foreground mt-1">
								Smooth transitions and hover effects
							</p>
						</div>
						<Switch
							checked={ui.animationsEnabled}
							onCheckedChange={(checked) => {
								updateUIPreferences({ animationsEnabled: checked });
								onSettingsChange(true);
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
