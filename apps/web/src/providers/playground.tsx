'use client';

import { UserProvider } from '@/contexts/user-context';
import { ThreadProvider } from '@/contexts/thread-context';
import { AssistantProvider } from '@/contexts/assistant-context';
import { ApplicationProvider } from '@/contexts/application-context';
import { GraphProvider } from '@/contexts/graph-context';
import { ReactNode } from 'react';

interface PlaygroundProvidersProps {
	children: ReactNode;
}

export function PlaygroundProviders({ children }: PlaygroundProvidersProps) {
	return (
		<UserProvider>
			<AssistantProvider>
				<ApplicationProvider>
					<ThreadProvider>
						<GraphProvider>{children}</GraphProvider>
					</ThreadProvider>
				</ApplicationProvider>
			</AssistantProvider>
		</UserProvider>
	);
}
