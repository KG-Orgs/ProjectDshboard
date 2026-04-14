export const API_VERSION = 'v1';

export interface ApiError {
	code: string;
	message: string;
}

export interface ApiSuccessResponse<T> {
	success: true;
	data: T;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: ApiError;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface User {
	id: string;
	name: string;
	email: string;
	role: 'manager' | 'worker' | 'admin';
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: User;
}

export interface Project {
	id: string;
	name: string;
	description?: string;
	status: 'planning' | 'active' | 'on-hold' | 'completed';
	progress: number;
	startDate: string;
	endDate: string;
	budget: number;
	spent: number;
}

export interface Task {
	id: string;
	projectId: string;
	title: string;
	description?: string;
	status: 'todo' | 'in-progress' | 'blocked' | 'done';
	priority: 'low' | 'medium' | 'high';
	assignee?: string;
	dueDate: string;
	createdAt: string;
}
