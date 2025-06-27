import type { Application, CreateApplicationData, UpdateApplicationData } from '@/types';

interface ApiResponse<T> {
	data?: T;
	error?: string;
	details?: any;
}

class ApplicationClientService {
	private readonly BASE_URL = '/api/application';

	/**
	 * Get all applications for the current user
	 */
	async getAllApplications(token?: string): Promise<ApiResponse<Application[]>> {
		try {
			const response = await fetch(this.BASE_URL, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` }),
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { error: errorData.error || 'Failed to fetch applications' };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('Error fetching applications:', error);
			return { error: 'Network error occurred' };
		}
	}

	/**
	 * Get a specific application by ID
	 */
	async getApplicationById(id: string, token?: string): Promise<ApiResponse<Application>> {
		try {
			const response = await fetch(`${this.BASE_URL}/${id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` }),
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { error: errorData.error || 'Failed to fetch application' };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('Error fetching application:', error);
			return { error: 'Network error occurred' };
		}
	}

	/**
	 * Create a new application
	 */
	async createApplication(
		applicationData: CreateApplicationData,
		token?: string,
	): Promise<ApiResponse<Application>> {
		try {
			const response = await fetch(this.BASE_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify(applicationData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return {
					error: errorData.error || 'Failed to create application',
					details: errorData.details,
				};
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('Error creating application:', error);
			return { error: 'Network error occurred' };
		}
	}

	/**
	 * Update an existing application
	 */
	async updateApplication(
		id: string,
		updateData: UpdateApplicationData,
		token?: string,
	): Promise<ApiResponse<Application>> {
		try {
			const response = await fetch(`${this.BASE_URL}/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` }),
				},
				body: JSON.stringify(updateData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				return {
					error: errorData.error || 'Failed to update application',
					details: errorData.details,
				};
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('Error updating application:', error);
			return { error: 'Network error occurred' };
		}
	}

	/**
	 * Delete an application
	 */
	async deleteApplication(
		id: string,
		token?: string,
	): Promise<ApiResponse<{ message: string; application: Application }>> {
		try {
			const response = await fetch(`${this.BASE_URL}/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` }),
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				return { error: errorData.error || 'Failed to delete application' };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			console.error('Error deleting application:', error);
			return { error: 'Network error occurred' };
		}
	}

	/**
	 * Toggle application status (using partial update)
	 */
	async toggleApplicationStatus(
		id: string,
		isActive: boolean,
		token?: string,
	): Promise<ApiResponse<Application>> {
		return this.updateApplication(id, { isActive }, token);
	}
}

export const applicationService = new ApplicationClientService();
