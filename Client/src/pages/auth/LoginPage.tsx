import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/hooks/auth/useLogin";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/auth.store";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof Schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", password: "" },
  });

  if (user && accessToken) {
    navigate("/app/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <div className="text-lg font-bold">SILK SAMAGRA MIS PORTAL</div>
          <div className="text-sm text-muted-foreground">Sign in to continue</div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            const res = await login.mutateAsync(values);
            if (res.ok) navigate("/app/dashboard", { replace: true });
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <div className="text-xs text-destructive">{form.formState.errors.email.message}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <div className="text-xs text-destructive">{form.formState.errors.password.message}</div>
            )}
          </div>

          {login.isError && (
            <div className="text-sm text-destructive">
              {login.error instanceof Error ? login.error.message : "Login failed"}
            </div>
          )}

          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

