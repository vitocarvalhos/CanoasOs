import type { InputHTMLAttributes } from "react";

export function CatalogInput({ label, name, options, ...props }: { label: string; name: string; options: string[] } & InputHTMLAttributes<HTMLInputElement>) {
  const listId = `${name}-catalog`;
  return <div><label className="label" htmlFor={name}>{label}</label><input className="field" id={name} name={name} list={listId} {...props} /><datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist></div>;
}
