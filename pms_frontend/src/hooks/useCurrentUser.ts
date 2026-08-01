/**
 * Fetches who's logged in and which organization they're acting as.
 * Used to replace any hardcoded org/user display in the UI (e.g. the
 * app header) with the real thing from /api/v1/organizations/me/.
 */

import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import type { CurrentUser } from "../types/models";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<CurrentUser>("/organizations/me/")
      .then(({ data }) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading };
}
