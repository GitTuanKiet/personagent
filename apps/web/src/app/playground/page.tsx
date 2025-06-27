'use client';

import { Playground } from '@/components/playground';
import { ApplicationProvider } from '@/contexts/application-context';
import { AssistantProvider } from '@/contexts/assistant-context';
import { ThreadProvider } from '@/contexts/thread-context';
import { GraphProvider } from '@/contexts/graph-context';
import { UserProvider } from '@/contexts/user-context';
import { Suspense } from 'react';

export default function PlaygroundPage() {
	return (
		<Suspense>
			<UserProvider>
				<AssistantProvider>
					<ApplicationProvider>
						<ThreadProvider>
							<GraphProvider>
								<Playground />
							</GraphProvider>
						</ThreadProvider>
					</ApplicationProvider>
				</AssistantProvider>
			</UserProvider>
		</Suspense>
	);
}
