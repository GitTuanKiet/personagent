import { ToolCallContentPartComponent } from '@assistant-ui/react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, WrenchIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

export const ToolFallback: ToolCallContentPartComponent = ({ toolName, argsText, result }) => {
	const [isCollapsed, setIsCollapsed] = useState(true);

	return (
		<div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white shadow-sm">
			<div className="flex items-center gap-3 px-4 py-3">
				<div className="flex items-center gap-2">
					<WrenchIcon className="h-4 w-4 text-slate-600" />
					<CheckIcon className="h-4 w-4 text-green-600" />
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium text-slate-900">
						Used tool:{' '}
						<Badge variant="outline" className="ml-1">
							{toolName}
						</Badge>
					</p>
					<p className="text-xs text-slate-500">Browser automation action completed</p>
				</div>
				<div className="flex-grow" />
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="h-8 w-8 p-0"
				>
					{isCollapsed ? (
						<ChevronDownIcon className="h-4 w-4" />
					) : (
						<ChevronUpIcon className="h-4 w-4" />
					)}
				</Button>
			</div>

			{!isCollapsed && (
				<div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
					<div className="px-4">
						<p className="text-xs font-medium text-slate-600 mb-2">Parameters:</p>
						<pre className="text-xs bg-slate-50 p-3 rounded border overflow-x-auto">{argsText}</pre>
					</div>

					{result !== undefined && (
						<div className="border-t border-dashed border-slate-200 px-4 pt-3 pb-3">
							<p className="text-xs font-medium text-slate-600 mb-2">Result:</p>
							<pre className="text-xs bg-green-50 p-3 rounded border border-green-200 overflow-x-auto">
								{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
