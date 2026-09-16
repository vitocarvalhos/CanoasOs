"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const supabase = createClient();

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError("Não foi possível entrar. Confira e-mail e senha.");
      } else {
        router.push("/today");
        router.refresh();
      }
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (authError) setError(authError.message);
      else setMessage("Conta criada. Confira seu e-mail para confirmar o acesso.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="field" id="email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input className="field" id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} placeholder="Mínimo de 6 caracteres" required />
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {message && <p className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">{message}</p>}
      <button className="primary-button w-full" disabled={loading}>{loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
      <button type="button" className="w-full text-center text-sm text-slate-400 hover:text-white" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
        {mode === "login" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
      </button>
    </form>
  );
}
