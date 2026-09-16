import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/today");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(47,112,216,.22),transparent_34%),linear-gradient(145deg,#090c12_10%,#0c1725_100%)]" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white text-sm font-black text-black">C</div>
          <span className="font-semibold tracking-tight">Canoas Sales OS</span>
        </div>
        <div className="relative max-w-2xl pb-12">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-blue-300">Execução comercial</p>
          <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-.04em]">Toda oportunidade termina em uma decisão.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">Uma fila clara, uma próxima ação por vez e zero leads esquecidos no pipeline.</p>
        </div>
        <p className="relative text-xs text-slate-600">Canoas Media · São Paulo</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-9 place-items-center rounded-lg bg-white text-sm font-black text-black">C</div>
            <span className="font-semibold">Canoas Sales OS</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">Área restrita</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Entre para começar</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Sua fila do dia, pipeline e histórico comercial em um só lugar.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
