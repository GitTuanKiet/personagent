'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { FileTextIcon, TreePineIcon } from 'lucide-react';

type GetContentArgs = {
	content_type: 'page' | 'ax_tree';
	include_links?: boolean;
	number_of_elements?: number;
};

export const GetContentTool = makeAssistantToolUI<GetContentArgs, string>({
	toolName: 'get_content',
	render: function GetContentUI({ args, result }) {
		const isPageContent = args.content_type === 'page';

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						{isPageContent ? (
							<FileTextIcon className="h-4 w-4 text-green-600" />
						) : (
							<TreePineIcon className="h-4 w-4 text-green-600" />
						)}
						<CardTitle className="text-sm font-medium">
							{isPageContent ? 'Get Page Content' : 'Get Accessibility Tree'}
						</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Extracted' : 'Extracting'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Content Type:</span>
							<Badge variant="outline" className="capitalize">
								{args.content_type.replace('_', ' ')}
							</Badge>
						</div>

						{isPageContent && args.include_links && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Include Links:</span>
								<Badge variant="outline">Yes</Badge>
							</div>
						)}

						{!isPageContent && args.number_of_elements && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Max Elements:</span>
								<Badge variant="outline">{args.number_of_elements}</Badge>
							</div>
						)}

						{result && (
							<div className="text-sm">
								<span className="text-muted-foreground">Extracted Content:</span>
								<div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs font-mono max-h-32 overflow-y-auto">
									{result.slice(0, 200)}...
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});
