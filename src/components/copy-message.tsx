"use client";

import { useState } from "react";
import { Check } from "@/components/icons";

export function CopyMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <button className="secondary-button" onClick={copy}>{copied ? <><Check size={15} /> Copiado</> : "Copiar mensagem"}</button>;
}
