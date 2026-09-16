import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { NewLeadForm } from "./new-lead-form";
import { createClient } from "@/lib/supabase/server";
import { initialCatalogOptions } from "@/lib/crm";

export const metadata = { title: "Novo lead" };

export default async function NewLeadPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("catalog_options").select("category,label").eq("active", true).order("label");
  const catalogs = Object.fromEntries(Object.entries(initialCatalogOptions).map(([category, defaults]) => [category, Array.from(new Set([...defaults, ...(data?.filter((item) => item.category === category).map((item) => item.label) ?? [])]))])) as typeof initialCatalogOptions;
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/leads" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft size={16} /> Voltar para leads</Link>
      <header className="mb-8"><p className="text-[11px] font-bold uppercase tracking-[.2em] text-blue-400">Cadastro orientado à ação</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Novo lead</h1><p className="mt-3 text-sm text-slate-500">O lead só entra no CRM quando já sabemos qual é o próximo passo.</p></header>
      <NewLeadForm catalogs={catalogs} />
    </div>
  );
}
