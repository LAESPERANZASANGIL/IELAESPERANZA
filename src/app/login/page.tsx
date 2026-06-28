import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">IE La Esperanza</h1>
          <p className="mt-1 text-sm text-slate-500">Sistema de gestión académica</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
