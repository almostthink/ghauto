import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Role, StaffUser } from "../lib/types";

// Mirror of the server-side permission map. The server is the boundary; this
// copy only decides which menu items and buttons are worth showing.
const PERMISSIONS: Record<Role, string[]> = {
  super_admin: ["*"],
  editor: ["content.read", "content.write", "media.write", "analytics.read", "reviews.read"],
  moderator: ["content.read", "reviews.read", "reviews.write", "analytics.read"],
  analyst: ["content.read", "analytics.read", "reviews.read"]
};

export const can = (role: Role | undefined, permission: string) => {
  if (!role) return false;
  const granted = PERMISSIONS[role] ?? [];
  return granted.includes("*") || granted.includes(permission);
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  editor: "Editor",
  moderator: "Moderator",
  analyst: "Analyst"
};

interface AuthValue {
  user: StaffUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthValue>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export function useSession() {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api<{ user: StaffUser }>("/auth/me");
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
    mutationFn: (body: { email: string; password: string }) =>
      api<{ user: StaffUser }>("/auth/login", { method: "POST", body }),
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
