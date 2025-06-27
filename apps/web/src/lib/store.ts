export const USER_APPLICATION_STORE_KEY = 'application';

export const createNamespace = (userId: string) => {
	return ['user_id', userId, 'application'];
};
