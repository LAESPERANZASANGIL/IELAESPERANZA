import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            CE
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>
        <ForgotPasswordForm />
        <a href="/login" className="text-sm font-medium text-brand-700 hover:underline">
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  );
}
