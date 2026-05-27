import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/auth.store";
import { authApi } from "@/services/auth/authApi";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      // If we have user in memory, allow.
      if (accessToken && user) return;
      // If we have token but no user, try /me.
      if (accessToken && !user) {
        try {
          const me = await authApi.me();
          if (!cancelled && me.ok) setAuth({ accessToken, user: me.user });
          return;
        } catch {
          // fallthrough to redirect
        }
      }
      if (!cancelled) {
        clear();
        navigate("/login", { replace: true, state: { from: location.pathname } });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, setAuth, clear, navigate, location.pathname]);

  if (!accessToken) return null;
  if (!user) return null;
  return <>{children}</>;
}

