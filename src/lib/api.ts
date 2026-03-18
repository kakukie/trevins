import { useAuthStore } from '@/store/auth-store';

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private async getHeaders(requireAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = useAuthStore.getState().token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<{ data?: T; error?: string; success: boolean }> {
    const { requireAuth = true, ...fetchOptions } = options;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers: {
          ...(await this.getHeaders(requireAuth)),
          ...fetchOptions.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Terjadi kesalahan',
          success: false,
        };
      }

      return { data, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
      };
    }
  }

  async get<T>(endpoint: string, requireAuth = true) {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  async post<T>(endpoint: string, body: unknown, requireAuth = true) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      requireAuth,
    });
  }

  async put<T>(endpoint: string, body: unknown, requireAuth = true) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      requireAuth,
    });
  }

  async delete<T>(endpoint: string, requireAuth = true) {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }
}

export const api = new ApiClient();
