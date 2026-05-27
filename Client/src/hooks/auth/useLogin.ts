import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/auth/authApi";
import { useAuthStore } from "@/stores/auth/auth.store";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (input: { email: string; password: string }) => authApi.login(input),
    onSuccess: (res) => {
      if (res.ok) {
        setAuth({ accessToken: res.accessToken, user: res.user });
      }
    },
  });
}

