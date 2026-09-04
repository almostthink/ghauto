import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AdminUser } from "../lib/types";

// The panel has a single administrator: being signed in is the only
// permission there is. The server checks the session on every request.
interface AuthValue {
  user: AdminUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthValue>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export function useSession() {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api<{ user: AdminUser }>("/auth/me");
      } catch {
        return { user: null };
      }
    },
    retry: false,
    staleTime: 60_000
  });
  return { user: data?.user ?? null, loading: isLoading };
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; password: string; turnstileToken?: string }) =>
      api<{ user: AdminUser }>("/auth/login", { method: "POST", body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["session"] })
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => client.clear()
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; name: string }) =>
      api<{ user: AdminUser }>("/auth/profile", { method: "PUT", body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["session"] })
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api<void>("/auth/password", { method: "POST", body })
  });
}
