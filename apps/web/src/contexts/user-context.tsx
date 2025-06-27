import type { SessionUser } from '@/lib/auth/types';
import { useSession } from '@/lib/auth/client';
import { createContext, ReactNode, useContext } from 'react';

type UserContentType = {
	isLoading: boolean;
	error: Error | null;
} & SessionUser;

const UserContext = createContext<UserContentType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const { data: sessionUser, isPending, error } = useSession();

	const contextValue: UserContentType = {
		...sessionUser,
		isLoading: isPending,
		error: error || null,
	};

	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUserContext() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error('useUserContext must be used within a UserProvider');
	}
	return context;
}
