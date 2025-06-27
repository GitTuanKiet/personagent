'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { ChevronDownIcon, ListIcon } from 'lucide-react';

type DropdownOptionsArgs = {
	action: 'get_options' | 'select_option';
	index: number;
	text?: string;
};

export const DropdownOptionsTool = makeAssistantToolUI<DropdownOptionsArgs, string>({
	toolName: 'dropdown_options',
	render: function DropdownOptionsUI({ args, result }) {
		const isGettingOptions = args.action === 'get_options';

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						{isGettingOptions ? (
							<ListIcon className="h-4 w-4 text-violet-600" />
						) : (
							<ChevronDownIcon className="h-4 w-4 text-violet-600" />
						)}
						<CardTitle className="text-sm font-medium">
							{isGettingOptions ? 'Get Dropdown Options' : 'Select Dropdown Option'}
						</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Completed' : 'Processing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Dropdown Element:</span>
							<Badge variant="outline">Index #{args.index}</Badge>
						</div>

						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Action:</span>
							<Badge variant="outline" className="capitalize">
								{args.action.replace('_', ' ')}
							</Badge>
						</div>

						{args.text && (
							<div className="text-sm">
								<span className="text-muted-foreground">Option to Select:</span>
								<div className="mt-1 p-2 bg-violet-50 border border-violet-200 rounded font-mono text-xs">
									"{args.text}"
								</div>
							</div>
						)}

						{result && (
							<div className="text-sm">
								<span className="text-muted-foreground">Result:</span>
								<div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs font-mono max-h-32 overflow-y-auto">
									{result}
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});
