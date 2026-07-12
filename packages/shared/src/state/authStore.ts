/**
 * Auth Store — Using Zustand for cross-platform state management
 * Stores authenticated user state for the web MVP.
 */

import type { AuthLoginRequest, AuthMeResponse } from "../types/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/entities";

export interface AuthState {
  user: User | null;
  capabilities: AuthMeResponse["capabilities"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (request: AuthLoginRequest) => Promise<void>;
  hydrate: () => Promise<void>;
  setAuth: (user: User) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => undefined)) as T;

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      capabilities: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (request) => {
        set({ isLoading: true, error: null });

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15_000);
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const data = (await response.json()) as { message?: string };
            throw new Error(data.message ?? "Login failed");
          }

          const data = (await response.json()) as { user: User };
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error && error.name === "AbortError"
              ? "Sign-in timed out while finalizing the callback. Retry from /login."
              : error instanceof Error
                ? error.message
                : "Login failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      hydrate: async () => {
        await useAuthStore.persist.rehydrate();

        set({ isLoading: true, error: null });

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15_000);
          const meResponse = await fetchJson<AuthMeResponse>("/api/auth/me", {
            method: "GET",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!meResponse.ok || !meResponse.data?.user) {
            if (meResponse.status === 401) {
              await useAuthStore.persist.clearStorage();
              set({
                user: null,
                capabilities: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              return;
            }

            throw new Error("Session expired. Sign in again.");
          }

          set({
            user: meResponse.data.user,
            capabilities: meResponse.data.capabilities ?? null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error && error.name === "AbortError"
              ? "Session restore timed out. Sign in again."
              : error instanceof Error
                ? error.message
                : "Session expired. Sign in again.";
          set({
            user: null,
            capabilities: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
        }
      },

      setAuth: (user) => {
        set({
          user,
          isAuthenticated: true,
          error: null,
        });
      },

      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
        }).catch(() => undefined);

        set({
          user: null,
          isAuthenticated: false,
          capabilities: null,
          error: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
