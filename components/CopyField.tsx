"use client";

import { useState } from "react";

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <div className="copy">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="secondary" onClick={copy}>{copied ? "Copiado!" : "Copiar"}</button>
    </div>
  );
}
