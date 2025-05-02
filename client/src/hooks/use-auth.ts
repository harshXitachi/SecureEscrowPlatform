import { useAuth as useAuthContext, User } from "@/contexts/auth-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Re-export the useAuth hook with added TanStack Query mutation functionality
export function useAuth() {
  const auth = useAuthContext();
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const success = await auth.login(username, password);
      if (!success) throw new Error("Invalid credentials");
      return auth.user!;
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const success = await auth.register(username, password);
      if (!success) throw new Error("Registration failed");
      return auth.user!;
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await auth.logout();
      queryClient.setQueryData(["/api/auth/me"], null);
    }
  });

  return {
    ...auth,
    loginMutation,
    registerMutation,
    logoutMutation
  };
}

// Re-export the User type
export type { User };