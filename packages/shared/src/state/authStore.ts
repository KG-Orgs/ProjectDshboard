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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const AUTH_FETCH_TIMEOUT_MS = 60_000;
const AUTH_FETCH_MAX_ATTEMPTS = 4;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      capabilities: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (request) => {
        set({ isLoading: true, error: null });

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);
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

        let lastMessage = "Session expired. Sign in again.";

        for (let attempt = 1; attempt <= AUTH_FETCH_MAX_ATTEMPTS; attempt += 1) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);
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

              if (meResponse.status === 503 && attempt < AUTH_FETCH_MAX_ATTEMPTS) {
                await sleep(2_000 * attempt);
                continue;
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
            return;
          } catch (error) {
            lastMessage =
              error instanceof Error && error.name === "AbortError"
                ? "Session restore timed out while the API was waking up. Refresh to retry."
                : error instanceof Error
                  ? error.message
                  : "Session expired. Sign in again.";

            if (attempt < AUTH_FETCH_MAX_ATTEMPTS) {
              await sleep(2_000 * attempt);
              continue;
            }
          }
        }

        // Keep a previously persisted user so a cold-start blip doesn't force re-login.
        const existingUser = get().user;
        if (existingUser) {
          set({
            user: existingUser,
            isAuthenticated: true,
            isLoading: false,
            error: lastMessage,
          });
          return;
        }

        set({
          user: null,
          capabilities: null,
          isAuthenticated: false,
          isLoading: false,
          error: lastMessage,
        });
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
