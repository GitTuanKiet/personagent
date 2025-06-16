'use client';

import { useFormContext } from 'react-hook-form';
import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { ENV_VAR_TYPES } from './constants';
import type { ApplicationFormData, ApplicationEnvVar } from './types';

export function EnvironmentTab() {
	const form = useFormContext<ApplicationFormData>();
	const [newEnvVar, setNewEnvVar] = useState<ApplicationEnvVar>({
		key: '',
		value: '',
		type: 'string',
	});

	const env = form.watch('env');

	const addEnvVar = () => {
		if (newEnvVar.key.trim() && newEnvVar.value !== '') {
			let processedValue: string | number | boolean = newEnvVar.value;

			if (newEnvVar.type === 'number') {
				processedValue = parseFloat(newEnvVar.value.toString());
				if (isNaN(processedValue)) return;
			} else if (newEnvVar.type === 'boolean') {
				processedValue = newEnvVar.value.toString().toLowerCase() === 'true';
			}

			form.setValue('env', {
				...env,
				[newEnvVar.key.trim()]: processedValue,
			});
			setNewEnvVar({ key: '', value: '', type: 'string' });
		}
	};

	const removeEnvVar = (key: string) => {
		const newEnv = { ...env };
		delete newEnv[key];
		form.setValue('env', newEnv);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addEnvVar();
		}
	};

	const envEntries = Object.entries(env);

	const getValueDisplay = (value: string | number | boolean) => {
		if (typeof value === 'boolean') {
			return value.toString();
		}
		return value.toString();
	};

	const getTypeDisplay = (value: string | number | boolean) => {
		return typeof value;
	};

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="env"
				render={() => (
					<FormItem>
						<FormLabel className="text-base font-medium">Environment Variables</FormLabel>
						<FormDescription>
							Add environment variables that will be available during simulation
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-4">
				<div className="grid grid-cols-4 gap-2">
					<div className="space-y-2">
						<FormLabel htmlFor="envKey">Variable Name</FormLabel>
						<Input
							id="envKey"
							placeholder="API_KEY"
							value={newEnvVar.key}
							onChange={(e) => setNewEnvVar((prev) => ({ ...prev, key: e.target.value }))}
							onKeyPress={handleKeyPress}
						/>
					</div>
					<div className="space-y-2">
						<FormLabel htmlFor="envValue">Value</FormLabel>
						<Input
							id="envValue"
							placeholder="your-api-key"
							value={newEnvVar.value.toString()}
							onChange={(e) => setNewEnvVar((prev) => ({ ...prev, value: e.target.value }))}
							onKeyPress={handleKeyPress}
						/>
					</div>
					<div className="space-y-2">
						<FormLabel htmlFor="envType">Type</FormLabel>
						<Select
							value={newEnvVar.type}
							onValueChange={(value: 'string' | 'number' | 'boolean') =>
								setNewEnvVar((prev) => ({ ...prev, type: value }))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ENV_VAR_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<FormLabel>&nbsp;</FormLabel>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addEnvVar}
							disabled={!newEnvVar.key.trim() || newEnvVar.value === ''}
							className="w-full"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{envEntries.length > 0 && (
					<div className="space-y-2">
						<FormLabel>Current Variables</FormLabel>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{envEntries.map(([key, value]) => (
								<div
									key={key}
									className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												{key}
											</Badge>
											<Badge variant="secondary" className="text-xs">
												{getTypeDisplay(value)}
											</Badge>
											<span className="text-sm truncate">{getValueDisplay(value)}</span>
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => removeEnvVar(key)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{envEntries.length === 0 && (
					<div className="text-center py-8 text-muted-foreground">
						<p>No environment variables configured</p>
						<p className="text-sm">Add variables that will be available during simulation</p>
					</div>
				)}
			</div>
		</div>
	);
}
