/**
 * Central Axios instance for all API calls.
 *
 * Every module's API file (properties/tenants/leases/rentals) imports
 * this instead of creating its own axios instance, so auth headers,
 * base URL, and token-refresh behavior are defined in exactly one
 * place. If the auth scheme ever changes, this is the only file that
 * needs to change.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Attach the access token to every outgoing request.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request fails with 401, try refreshing the token once, then retry.
// This keeps a user logged in across an access-token expiry without
// forcing every page to handle refresh logic individually.
let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Wait for the in-flight refresh to finish, then retry this request.
      return new Promise((resolve) => {
        pendingQueue.push(() => resolve(apiClient(originalRequest)));
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      localStorage.setItem("access_token", data.access);
      pendingQueue.forEach((run) => run());
      pendingQueue = [];
      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
