'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { MouseIcon } from 'lucide-react';

type DragDropArgs = {
	element_source?: string;
	element_target?: string;
	element_source_offset?: { x: number; y: number };
	element_target_offset?: { x: number; y: number };
	coord_source_x?: number;
	coord_source_y?: number;
	coord_target_x?: number;
	coord_target_y?: number;
	steps?: number;
	delay_ms?: number;
};

export const DragDropTool = makeAssistantToolUI<DragDropArgs, string>({
	toolName: 'drag_drop',
	render: function DragDropUI({ args, result }) {
		const usingElements = args.element_source && args.element_target;
		const usingCoords = args.coord_source_x !== undefined && args.coord_target_x !== undefined;

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<MouseIcon className="h-4 w-4 text-purple-600" />
						<CardTitle className="text-sm font-medium">Drag & Drop</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Completed' : 'Executing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						{usingElements && (
							<>
								<div className="text-sm">
									<span className="text-muted-foreground">Source Element:</span>
									<p className="mt-1 text-foreground font-mono text-xs bg-blue-50 p-2 rounded">
										{args.element_source}
									</p>
								</div>
								<div className="text-sm">
									<span className="text-muted-foreground">Target Element:</span>
									<p className="mt-1 text-foreground font-mono text-xs bg-green-50 p-2 rounded">
										{args.element_target}
									</p>
								</div>
							</>
						)}

						{usingCoords && (
							<div className="grid grid-cols-2 gap-3">
								<div className="text-sm">
									<span className="text-muted-foreground">From:</span>
									<Badge variant="outline" className="ml-2">
										({args.coord_source_x}, {args.coord_source_y})
									</Badge>
								</div>
								<div className="text-sm">
									<span className="text-muted-foreground">To:</span>
									<Badge variant="outline" className="ml-2">
										({args.coord_target_x}, {args.coord_target_y})
									</Badge>
								</div>
							</div>
						)}

						{(args.element_source_offset || args.element_target_offset) && (
							<div className="grid grid-cols-2 gap-3">
								{args.element_source_offset && (
									<div className="text-sm">
										<span className="text-muted-foreground">Source Offset:</span>
										<Badge variant="outline" className="ml-2">
											({args.element_source_offset.x}, {args.element_source_offset.y})
										</Badge>
									</div>
								)}
								{args.element_target_offset && (
									<div className="text-sm">
										<span className="text-muted-foreground">Target Offset:</span>
										<Badge variant="outline" className="ml-2">
											({args.element_target_offset.x}, {args.element_target_offset.y})
										</Badge>
									</div>
								)}
							</div>
						)}

						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Steps: {args.steps || 10}</span>
							<span>Delay: {args.delay_ms || 5}ms</span>
						</div>

						{result && (
							<div className="text-sm text-green-800 bg-green-50 p-2 rounded">{result}</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});
