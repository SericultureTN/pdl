import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth/auth.store";
import { authApi } from "@/services/auth/authApi";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  return (
    <div className="h-full flex items-center justify-between px-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">SILK SAMAGRA MIS PORTAL</div>
        <div className="text-xs text-muted-foreground truncate">Sericulture Department</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="truncate max-w-[240px]">{user?.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await authApi.logout();
            } finally {
              clear();
              navigate("/login", { replace: true });
            }
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

