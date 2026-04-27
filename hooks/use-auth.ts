import { useCallback } from "react";
import { authClient, useSession } from "@/lib/auth-client";

export function useAuth() {
  const {
    data: session,
    isPending: sessionLoading,
    error: sessionError,
  } = useSession();

  const signOut = useCallback(async () => {
    await authClient.signOut();
    window.location.reload();
  }, []);

  return {
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    isLoading: sessionLoading,
    error: sessionError,
    signOut,
  };
}
