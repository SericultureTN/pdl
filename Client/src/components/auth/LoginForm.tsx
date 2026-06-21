import { FormEvent, useState } from 'react';
import { User } from 'lucide-react';
import { authService } from '../../services/auth.js';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import PasswordInput from './PasswordInput';
import GovernmentLogo from './GovernmentLogo';
import PageFooter from '../common/PageFooter';

interface LoginFormProps {
  onLogin: (user: unknown) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(username, password);
      if (result.ok) {
        onLogin(result.user);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col px-6 py-10 sm:px-12 lg:px-16 lg:py-12">
      <div className="mx-auto w-full max-w-md flex-1 animate-fade-in">
        <div className="mb-10 flex flex-col items-center text-center">
          <GovernmentLogo />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0B5D3B] sm:text-3xl">
            SILK SAMAGRA
            <br />
            MIS PORTAL
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Sericulture Department,
            <br />
            Government of Tamil Nadu
          </p>
        </div>

        <h2 className="mb-8 text-lg font-semibold text-gray-900">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="Enter username"
                aria-label="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                className="pl-12"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="flex justify-end">
            <a
              href="#forgot-password"
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 rounded"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>

      <PageFooter />
    </div>
  );
}
