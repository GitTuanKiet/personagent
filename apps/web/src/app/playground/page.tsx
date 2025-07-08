'use client';

import { Playground } from '@/components/playground';
import { AssistantProvider } from '@/contexts/assistant-context';
import { ApplicationProvider } from '@/contexts/application-context';
import { ThreadProvider } from '@/contexts/thread-context';
import { GraphProvider } from '@/contexts/graph-context';
import { Suspense } from 'react';
import { useVisitorId } from '@/hooks/use-visitorId';

export default function PlaygroundPage() {
	const { visitorId, isLoading } = useVisitorId();

	if (isLoading || !visitorId) {
		return <div>Loading...</div>;
	}

	return (
		<Suspense>
			<AssistantProvider visitorId={visitorId}>
				<ApplicationProvider visitorId={visitorId}>
					<ThreadProvider visitorId={visitorId}>
						<GraphProvider>
							<Playground />
						</GraphProvider>
					</ThreadProvider>
				</ApplicationProvider>
			</AssistantProvider>
		</Suspense>
	);
}
