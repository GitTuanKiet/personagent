import { StateCreator } from 'zustand';

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number;
	timestamp: number;
	read: boolean;
	actions?: Array<{
		label: string;
		action: () => void;
	}>;
}

export interface NotificationState {
	notifications: Notification[];
	unreadCount: number;
}

export interface NotificationActions {
	addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
	removeNotification: (id: string) => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	clearNotifications: () => void;
	clearOldNotifications: (olderThanHours?: number) => void;
}

export type NotificationSlice = NotificationState & NotificationActions;

export const createNotificationSlice: StateCreator<NotificationSlice, [], [], NotificationSlice> = (
	set,
	get,
) => ({
	// Initial state
	notifications: [],
	unreadCount: 0,

	// Actions
	addNotification: (notification) => {
		const newNotification: Notification = {
			...notification,
			id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
			read: false,
		};

		const notifications = [newNotification, ...get().notifications];
		const unreadCount = notifications.filter((n) => !n.read).length;

		set({ notifications, unreadCount });

		// Auto-remove notification after duration (default 5 seconds)
		const duration = notification.duration ?? 5000;
		if (duration > 0) {
			setTimeout(() => {
				get().removeNotification(newNotification.id);
			}, duration);
		}
	},

	removeNotification: (id: string) => {
		const notifications = get().notifications.filter((n) => n.id !== id);
		const unreadCount = notifications.filter((n) => !n.read).length;

		set({ notifications, unreadCount });
	},

	markAsRead: (id: string) => {
		const notifications = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
		const unreadCount = notifications.filter((n) => !n.read).length;

		set({ notifications, unreadCount });
	},

	markAllAsRead: () => {
		const notifications = get().notifications.map((n) => ({ ...n, read: true }));
		set({ notifications, unreadCount: 0 });
	},

	clearNotifications: () => {
		set({ notifications: [], unreadCount: 0 });
	},

	clearOldNotifications: (olderThanHours = 24) => {
		const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
		const notifications = get().notifications.filter((n) => n.timestamp > cutoffTime);
		const unreadCount = notifications.filter((n) => !n.read).length;

		set({ notifications, unreadCount });
	},
});
