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
import { BellIcon, PlayIcon } from 'lucide-react';

import {
	useUserPreferences,
	useNotificationPreferences,
	useSimulationPreferences,
} from '@/store/user/selectors';

interface NotificationsTabProps {
	onSettingsChange: (hasChanges: boolean) => void;
}

export function NotificationsTab({ onSettingsChange }: NotificationsTabProps) {
	const { preferences } = useUserPreferences();
	const { updateNotificationPrefs } = useNotificationPreferences();
	const { updateSimulationPrefs } = useSimulationPreferences();

	return (
		<div className="space-y-6">
			<div className="bg-muted/30 rounded-xl p-6">
				<div className="flex items-center gap-3 mb-4">
					<BellIcon className="text-muted-foreground" size={18} />
					<h3 className="font-semibold text-lg">Notifications</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between p-4 bg-background rounded-lg border">
						<div>
							<Label className="text-sm font-medium">Enable Notifications</Label>
							<p className="text-xs text-muted-foreground mt-1">
								Show notifications for simulation updates
							</p>
						</div>
						<Switch
							checked={preferences.enableNotifications}
							onCheckedChange={(checked) => {
								updateNotificationPrefs({ enableNotifications: checked });
								onSettingsChange(true);
							}}
						/>
					</div>

					<div className="flex items-center justify-between p-4 bg-background rounded-lg border">
						<div>
							<Label className="text-sm font-medium">Notification Sounds</Label>
							<p className="text-xs text-muted-foreground mt-1">
								Play sound alerts for important events
							</p>
						</div>
						<Switch
							checked={preferences.notificationSounds}
							onCheckedChange={(checked) => {
								updateNotificationPrefs({ notificationSounds: checked });
								onSettingsChange(true);
							}}
						/>
					</div>
				</div>
			</div>

			<div className="bg-muted/30 rounded-xl p-6">
				<div className="flex items-center gap-3 mb-4">
					<PlayIcon className="text-muted-foreground" size={18} />
					<h3 className="font-semibold text-lg">Simulation Preferences</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between p-4 bg-background rounded-lg border">
						<div>
							<Label className="text-sm font-medium">Auto-start Simulations</Label>
							<p className="text-xs text-muted-foreground mt-1">
								Automatically start simulations when created
							</p>
						</div>
						<Switch
							checked={preferences.autoStartSimulations}
							onCheckedChange={(checked) => {
								updateSimulationPrefs({ autoStartSimulations: checked });
								onSettingsChange(true);
							}}
						/>
					</div>

					<div className="grid grid-cols-2 gap-6">
						<div>
							<Label className="text-sm font-medium mb-3 block">Max Concurrent</Label>
							<Select
								value={preferences.maxConcurrentSimulations.toString()}
								onValueChange={(value) => {
									updateSimulationPrefs({ maxConcurrentSimulations: parseInt(value) });
									onSettingsChange(true);
								}}
							>
								<SelectTrigger className="h-11 rounded-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">1 simulation</SelectItem>
									<SelectItem value="2">2 simulations</SelectItem>
									<SelectItem value="3">3 simulations</SelectItem>
									<SelectItem value="5">5 simulations</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-sm font-medium mb-3 block">Default Timeout</Label>
							<Select
								value={(preferences.defaultSimulationTimeout / 60000).toString()}
								onValueChange={(value) => {
									updateSimulationPrefs({
										defaultSimulationTimeout: parseInt(value) * 60000,
									});
									onSettingsChange(true);
								}}
							>
								<SelectTrigger className="h-11 rounded-lg">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="2">2 minutes</SelectItem>
									<SelectItem value="5">5 minutes</SelectItem>
									<SelectItem value="10">10 minutes</SelectItem>
									<SelectItem value="15">15 minutes</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
