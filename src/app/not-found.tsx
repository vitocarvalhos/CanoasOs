import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-5"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">404</p><h1 className="mt-3 text-3xl font-semibold">Página não encontrada</h1><Link href="/today" className="primary-button mt-6">Voltar para Hoje</Link></div></main>;
}
