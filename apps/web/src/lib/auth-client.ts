import type { GetCurrentUserResponse } from '@flagbase/types';

const API_BASE = 'http://localhost:3001/api/v1';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function register(data: RegisterData): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }
}

export async function login(data: LoginData): Promise<GetCurrentUserResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }
  return response.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getCurrentUser(): Promise<GetCurrentUserResponse | null> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}
