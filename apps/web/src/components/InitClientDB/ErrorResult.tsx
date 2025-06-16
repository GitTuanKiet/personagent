import React, { useState } from 'react';
import { useGlobalStore } from '@/store/global';

import {
	Dialog,
	DialogTitle,
	DialogDescription,
	DialogContent,
	DialogFooter,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';

const ErrorResult: React.FC<{
	children: (props: { setOpen: (v: boolean) => void }) => React.ReactNode;
}> = ({ children }) => {
	const { initClientDBError, initClientDBMigrations } = useGlobalStore();
	const [open, setOpen] = useState(false);
	return (
		<>
			{children({ setOpen })}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTitle>Error</DialogTitle>
				<DialogDescription>{initClientDBError?.message}</DialogDescription>
				<DialogContent>
					<pre>{JSON.stringify(initClientDBMigrations, null, 2)}</pre>
				</DialogContent>
				<DialogFooter>
					<Button onClick={() => setOpen(false)}>Close</Button>
				</DialogFooter>
			</Dialog>
		</>
	);
};

export default ErrorResult;
