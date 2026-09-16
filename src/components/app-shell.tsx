import { Suspense } from "react";
import { LogOut } from "@/components/icons";
import { NavLink } from "@/components/nav-link";
import { signOutAction } from "@/app/(app)/actions";

export function AppShell({ children, email, name }: { children: React.ReactNode; email: string; name: string }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
      <aside className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#080a0e]/95 px-4 backdrop-blur md:h-screen md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-4 md:py-5">
        <div className="flex items-center gap-3 md:px-2">
          <div className="grid size-9 place-items-center rounded-lg bg-white text-sm font-black text-black">C</div>
          <div>
            <p className="text-sm font-semibold leading-none">Canoas</p>
            <p className="mt-1 text-[10px] uppercase tracking-[.16em] text-slate-500">Sales OS</p>
          </div>
        </div>
        <nav className="ml-auto flex gap-1 md:ml-0 md:mt-9 md:flex-col">
          <Suspense fallback={null}>
            <NavLink href="/today" label="Hoje" icon="today" />
            <NavLink href="/pipeline" label="Pipeline" icon="pipeline" />
            <NavLink href="/leads" label="Leads" icon="leads" />
          </Suspense>
        </nav>
        <div className="mt-auto hidden border-t border-white/10 pt-4 md:block">
          <p className="truncate px-2 text-xs font-semibold text-slate-300">{name}</p>
          <p className="mt-1 truncate px-2 text-[11px] text-slate-600">{email}</p>
          <form action={signOutAction} className="mt-3">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-white/[.05] hover:text-white"><LogOut size={16} /> Sair</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
