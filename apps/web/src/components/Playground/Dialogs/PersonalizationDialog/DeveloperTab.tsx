'use client';

import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { CodeIcon } from 'lucide-react';

import { useUIPreferences, useDeveloperPreferences } from '@/store/user/selectors';

interface DeveloperTabProps {
	onSettingsChange: (hasChanges: boolean) => void;
}

export function DeveloperTab({ onSettingsChange }: DeveloperTabProps) {
	const { ui } = useUIPreferences();
	const { updateDeveloperPrefs } = useDeveloperPreferences();

	return (
		<div className="space-y-6">
			<div className="bg-muted/30 rounded-xl p-6">
				<div className="flex items-center gap-3 mb-4">
					<CodeIcon className="text-muted-foreground" size={18} />
					<h3 className="font-semibold text-lg">Developer Preferences</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between p-4 bg-background rounded-lg border">
						<div>
							<Label className="text-sm font-medium">Show Debug Information</Label>
							<p className="text-xs text-muted-foreground mt-1">
								Display technical details and debug data
							</p>
						</div>
						<Switch
							checked={ui.showDebugInfo}
							onCheckedChange={(checked) => {
								updateDeveloperPrefs({ showDebugInfo: checked });
								onSettingsChange(true);
							}}
						/>
					</div>

					<div className="flex items-center justify-between p-4 bg-background rounded-lg border">
						<div>
							<Label className="text-sm font-medium">Auto-scroll Logs</Label>
							<p className="text-xs text-muted-foreground mt-1">
								Automatically scroll to latest log entries
							</p>
						</div>
						<Switch
							checked={ui.autoScrollLogs}
							onCheckedChange={(checked) => {
								updateDeveloperPrefs({ autoScrollLogs: checked });
								onSettingsChange(true);
							}}
						/>
					</div>

					<div>
						<Label className="text-sm font-medium mb-3 block">Log Level</Label>
						<Select
							value={ui.logLevel}
							onValueChange={(value: 'info' | 'debug' | 'error') => {
								updateDeveloperPrefs({ logLevel: value });
								onSettingsChange(true);
							}}
						>
							<SelectTrigger className="h-11 rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="error">Error only</SelectItem>
								<SelectItem value="info">Info & Error</SelectItem>
								<SelectItem value="debug">All (Debug)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</div>
	);
}
