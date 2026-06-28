import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            CE
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Campus La Esperanza</h1>
          <p className="mt-1 text-sm text-slate-500">Plataforma de gestión académica</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
