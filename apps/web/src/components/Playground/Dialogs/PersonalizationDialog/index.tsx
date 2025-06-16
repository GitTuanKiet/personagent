'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
	PaletteIcon,
	TypeIcon,
	PlayIcon,
	BellIcon,
	CodeIcon,
	KeyIcon,
	RotateCcwIcon,
} from 'lucide-react';

import {
	useSettings,
	useUserPreferences,
	useUIPreferences,
	usePersonalizationDialog,
} from '@/store/user/selectors';

import { AppearanceTab } from './AppearanceTab';
import { DeveloperTab } from './DeveloperTab';
import { NotificationsTab } from './NotificationsTab';
import { AIProviderTab } from './AIProviderTab';

export default function PersonalizationDialog() {
	const { isOpen, closeDialog } = usePersonalizationDialog();
	const { saveSettings, clearSettings } = useSettings();
	const { resetUserPreferences } = useUserPreferences();
	const { resetUIPreferences } = useUIPreferences();

	const [hasChanges, setHasChanges] = useState(false);

	const handleSave = () => {
		saveSettings();
		setHasChanges(false);
		closeDialog();
	};

	const handleReset = () => {
		resetUIPreferences();
		resetUserPreferences();
		setHasChanges(true);
	};

	const handleClear = () => {
		clearSettings();
		setHasChanges(false);
		closeDialog();
	};

	return (
		<Dialog open={isOpen} onOpenChange={closeDialog}>
			<DialogContent className="!w-[90vw] !max-w-[1200px] !min-w-[800px] h-[90vh] overflow-y-auto rounded-2xl p-8">
				<DialogHeader className="space-y-3">
					<DialogTitle className="flex items-center gap-3 text-2xl">
						<PaletteIcon className="text-primary" size={24} />
						Personalization Settings
					</DialogTitle>
					<DialogDescription className="text-base">
						Customize your PersonAgent experience with themes, layouts, and preferences.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="appearance" className="mt-6">
					<TabsList className="flex w-full border-b border-border mb-6">
						<TabsTrigger
							value="appearance"
							className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium justify-center data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
						>
							<TypeIcon className="w-4 h-4" />
							Appearance
						</TabsTrigger>
						<TabsTrigger
							value="developer"
							className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium justify-center data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
						>
							<CodeIcon className="w-4 h-4" />
							Developer
						</TabsTrigger>
						<TabsTrigger
							value="notifications"
							className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium justify-center data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
						>
							<BellIcon className="w-4 h-4" />
							Notifications
						</TabsTrigger>
						<TabsTrigger
							value="api"
							className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium justify-center data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
						>
							<KeyIcon className="w-4 h-4" />
							AI Provider
						</TabsTrigger>
					</TabsList>

					<TabsContent value="appearance">
						<AppearanceTab onSettingsChange={setHasChanges} />
					</TabsContent>

					<TabsContent value="developer">
						<DeveloperTab onSettingsChange={setHasChanges} />
					</TabsContent>

					<TabsContent value="notifications">
						<NotificationsTab onSettingsChange={setHasChanges} />
					</TabsContent>

					<TabsContent value="api">
						<AIProviderTab onSettingsChange={setHasChanges} />
					</TabsContent>
				</Tabs>

				{hasChanges && (
					<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mt-6">
						<div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
							<Badge variant="outline" className="text-xs">
								Unsaved Changes
							</Badge>
							<span className="text-sm font-medium">You have unsaved personalization settings</span>
						</div>
					</div>
				)}

				<DialogFooter className="gap-3 pt-6">
					<Button
						variant="outline"
						onClick={handleReset}
						className="gap-2 h-11 rounded-lg"
						size="lg"
					>
						<RotateCcwIcon size={14} />
						Reset to Defaults
					</Button>

					<Button
						variant="outline"
						onClick={handleClear}
						className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-11 rounded-lg"
						size="lg"
					>
						Clear All Settings
					</Button>

					<Button onClick={handleSave} className="gap-2 h-11 rounded-lg" size="lg">
						Save Settings
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
