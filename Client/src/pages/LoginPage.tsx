import LoginForm from '../components/auth/LoginForm';
import HeroIllustration from '../components/auth/HeroIllustration';

interface LoginPageProps {
  onLogin: (user: unknown) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="flex min-h-[50vh] flex-1 flex-col bg-white lg:min-h-screen lg:w-1/2">
        <LoginForm onLogin={onLogin} />
      </section>

      <section
        className="relative hidden min-h-screen flex-1 overflow-hidden lg:flex lg:w-1/2"
        style={{
          background: 'linear-gradient(180deg, #001B12 0%, #014227 50%, #001B12 100%)',
        }}
        aria-hidden="true"
      >
        <HeroIllustration />
      </section>

      <section
        className="relative flex min-h-[40vh] flex-1 overflow-hidden lg:hidden"
        style={{
          background: 'linear-gradient(180deg, #001B12 0%, #014227 50%, #001B12 100%)',
        }}
        aria-hidden="true"
      >
        <HeroIllustration />
      </section>
    </div>
  );
}
