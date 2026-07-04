"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LandingLoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("Usuario o contraseña incorrectos."); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-5">
      {/* Campo usuario */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="email"
          className="w-28 shrink-0 rounded px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
          style={{ background: "#c0775a" }}
        >
          Usuario
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none"
          style={{ borderColor: "#F2C94C", borderWidth: "2px" }}
        />
      </div>

      {/* Campo contraseña */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="password"
          className="w-28 shrink-0 rounded px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white"
          style={{ background: "#c0775a" }}
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none"
          style={{ borderColor: "#F2C94C", borderWidth: "2px" }}
        />
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-opacity disabled:opacity-60"
          style={{ background: "#0B6B3A" }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <a
          href="/forgot-password"
          className="text-xs hover:underline"
          style={{ color: "#1E4E8C" }}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
}
