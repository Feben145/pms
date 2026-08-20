/**
 * Generic list+create hook for a REST collection endpoint.
 *
 * Every module (Properties, Tenants, Leases, Invoices) hits this
 * instead of hand-rolling its own fetch/loading/error state, so a list
 * page is just "what columns do I show" and "what does the create form
 * look like" -- not boilerplate plumbing repeated four times.
 *
 * Deliberately not using a caching library (React Query, SWR) yet --
 * Phase 1 doesn't need it, and adding one is a drop-in upgrade later
 * without changing how pages call this hook.
 */

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";

interface Paginated<T> {
  count: number;
  results: T[];
}

export function useCollection<T>(
  endpoint: string,
  params?: Record<string, string | number>
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramString = params ? JSON.stringify(params) : "";

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<Paginated<T> | T[]>(
        endpoint,
        { params }
      );

      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.results)) {
        setItems(data.results);
      } else {
        console.warn(
          `Unexpected collection response from ${endpoint}:`,
          data
        );
        setItems([]);
      }
    } catch (err) {
      console.error(`Failed to load ${endpoint}:`, err);
      setItems([]);
      setError("Could not load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, paramString]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(payload: Partial<T>) {
    const { data } = await apiClient.post<T>(endpoint, payload);
    setItems((prev) => [data, ...prev]);
    return data;
  }

  async function update(id: number | string, payload: Partial<T>) {
    const { data } = await apiClient.patch<T>(
      `${endpoint}${id}/`,
      payload
    );

    setItems((prev) =>
      prev.map((item) =>
        (item as any).id === id ? data : item
      )
    );

    return data;
  }

  return {
    items,
    isLoading,
    error,
    refetch,
    create,
    update,
  };
}
