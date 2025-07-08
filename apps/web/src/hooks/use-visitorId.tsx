import { useState, useEffect } from 'react';
import { load } from '@fingerprintjs/fingerprintjs';

export const useVisitorId = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [visitorId, setVisitorId] = useState<string | null>(null);

	useEffect(() => {
		setIsLoading(true);
		load()
			.then((fpPromise) => fpPromise.get())
			.then((result) => {
				setVisitorId(result.visitorId);
				setIsLoading(false);
			});
	}, []);

	return { visitorId, isLoading };
};
