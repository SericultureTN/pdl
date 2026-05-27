import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/services/auth/authApi";
import { useAuthStore } from "@/stores/auth/auth.store";

export function useMe() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await authApi.me();
      // Access token may already be set; keep current token.
      // If backend also returns refreshed token later, we can extend schema.
      return res;
    },
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    onSuccess: (res) => {
      const token = useAuthStore.getState().accessToken;
      if (token) setAuth({ accessToken: token, user: res.user });
    },
    onError: () => {
      clear();
    },
  });
}

