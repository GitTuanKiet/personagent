'use client';

import { useState, useEffect } from 'react';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { EyeIcon, EyeOffIcon, BrainIcon, SettingsIcon } from 'lucide-react';

import { useAIProvider } from '@/store/user/selectors';
import type { AIProvider } from '@/store/user/slices/aiprovider';

interface AIProviderTabProps {
	onSettingsChange: (hasChanges: boolean) => void;
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
	openai: 'OpenAI',
	anthropic: 'Anthropic',
	gemini: 'Google Gemini',
};

export function AIProviderTab({ onSettingsChange }: AIProviderTabProps) {
	const {
		credentials,
		selectedModel,
		availableModels,
		setApiKey,
		getApiKey,
		clearApiKey,
		clearAllCredentials,
		setSelectedModel,
		getActiveProviders,
	} = useAIProvider();

	const [openaiKey, setOpenaiKey] = useState('');
	const [anthropicKey, setAnthropicKey] = useState('');
	const [geminiKey, setGeminiKey] = useState('');
	const [showKeys, setShowKeys] = useState(false);

	const activeProviders = getActiveProviders();

	useEffect(() => {
		setOpenaiKey(getApiKey('openai') || '');
		setAnthropicKey(getApiKey('anthropic') || '');
		setGeminiKey(getApiKey('gemini') || '');
	}, [getApiKey, credentials]);

	const handleSetKey = (provider: AIProvider) => {
		const keyMap = {
			openai: { value: openaiKey, reset: () => setOpenaiKey('') },
			anthropic: { value: anthropicKey, reset: () => setAnthropicKey('') },
			gemini: { value: geminiKey, reset: () => setGeminiKey('') },
		} as const;

		const item = keyMap[provider];
		if (!item.value.trim()) return;

		setApiKey(provider, item.value);
		item.reset();
		onSettingsChange(true);
	};

	const handleClearKey = (provider: AIProvider) => {
		clearApiKey(provider);

		// Reset local state
		if (provider === 'openai') setOpenaiKey('');
		if (provider === 'anthropic') setAnthropicKey('');
		if (provider === 'gemini') setGeminiKey('');

		onSettingsChange(true);
	};

	const handleClearAll = () => {
		clearAllCredentials();
		setOpenaiKey('');
		setAnthropicKey('');
		setGeminiKey('');
		onSettingsChange(true);
	};

	const handleModelChange = (value: string) => {
		const [provider, model] = value.split('|');
		if (provider && model) {
			setSelectedModel({ provider: provider as AIProvider, model });
			onSettingsChange(true);
		}
	};

	const renderKeyInput = (
		label: string,
		value: string,
		setValue: (val: string) => void,
		provider: AIProvider,
	) => {
		const hasStoredKey = !!credentials[`${provider}ApiKey` as keyof typeof credentials];

		return (
			<div className="space-y-2">
				<Label className="text-sm font-medium mb-1 block">
					{label}
					{hasStoredKey && (
						<span className="ml-2 text-xs text-green-600 font-normal">✓ Active</span>
					)}
				</Label>
				<div className="flex gap-2">
					<div className="relative flex-1">
						<input
							type={showKeys ? 'text' : 'password'}
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder={hasStoredKey ? '••••••••••••••••' : `Enter ${label}`}
							className="w-full p-2 border rounded-lg pr-10"
						/>
						<button
							onClick={() => setShowKeys(!showKeys)}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{showKeys ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
						</button>
					</div>
					<Button
						onClick={() => handleSetKey(provider)}
						disabled={!value.trim()}
						className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
					>
						Set
					</Button>
					<Button
						onClick={() => handleClearKey(provider)}
						variant="destructive"
						disabled={!hasStoredKey}
						className="px-4 py-2 rounded-lg disabled:opacity-50"
					>
						Clear
					</Button>
				</div>
			</div>
		);
	};

	const renderModelSelector = () => {
		if (activeProviders.length === 0) {
			return (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<p className="text-sm text-amber-800">Add at least one API key to select AI models.</p>
				</div>
			);
		}

		return (
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<BrainIcon className="text-muted-foreground" size={18} />
					<h4 className="font-medium">AI Model Selection</h4>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">Active Model</Label>
					<Select
						value={selectedModel ? `${selectedModel.provider}|${selectedModel.model}` : ''}
						onValueChange={handleModelChange}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select an AI model" />
						</SelectTrigger>
						<SelectContent>
							{activeProviders.map((provider) => (
								<div key={provider}>
									{availableModels[provider]?.map((model) => (
										<SelectItem key={`${provider}|${model}`} value={`${provider}|${model}`}>
											<div className="flex items-center gap-2">
												<span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
													{PROVIDER_LABELS[provider]}
												</span>
												<span>{model}</span>
											</div>
										</SelectItem>
									))}
								</div>
							))}
						</SelectContent>
					</Select>

					{selectedModel && (
						<p className="text-xs text-muted-foreground">
							Selected:{' '}
							<strong>
								{PROVIDER_LABELS[selectedModel.provider]} {selectedModel.model}
							</strong>
						</p>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<div className="bg-muted/30 rounded-xl p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<SettingsIcon className="text-muted-foreground" size={18} />
						<h3 className="font-semibold text-lg">AI Provider Configuration</h3>
					</div>
					<Button
						onClick={handleClearAll}
						variant="outline"
						size="sm"
						className="text-sm"
						disabled={activeProviders.length === 0}
					>
						Clear All
					</Button>
				</div>

				<div className="space-y-4">
					{renderKeyInput('OpenAI API Key', openaiKey, setOpenaiKey, 'openai')}
					{renderKeyInput('Anthropic API Key', anthropicKey, setAnthropicKey, 'anthropic')}
					{renderKeyInput('Gemini API Key', geminiKey, setGeminiKey, 'gemini')}
				</div>

				<div className="border-t pt-4">{renderModelSelector()}</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p className="text-sm text-blue-800">
						<strong>Privacy:</strong> API keys are stored locally in your browser and never sent to
						our servers. Available models update automatically based on your configured providers.
					</p>
				</div>
			</div>
		</div>
	);
}
