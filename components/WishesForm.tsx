"use client";

import { useState } from "react";
import type { Wishes } from "@/lib/types";

type Props = {
  initial?: Partial<Wishes>;
  nickLocked?: boolean;
  submitLabel: string;
  onSubmit: (w: Wishes) => Promise<void>;
  onCancel?: () => void;
};

export default function WishesForm({ initial = {}, nickLocked, submitLabel, onSubmit, onCancel }: Props) {
  const [w, setW] = useState<Wishes>({
    nick: initial.nick ?? "",
    theme: initial.theme ?? "",
    avoid: initial.avoid ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof Wishes) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setW({ ...w, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(w);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="nick">Seu nick</label>
      <input id="nick" required minLength={2} maxLength={30} placeholder="Como o grupo te conhece" value={w.nick} onChange={set("nick")} disabled={nickLocked} />

      <label htmlFor="theme">Um tema de presente</label>
      <input id="theme" required minLength={2} maxLength={60} placeholder="Ex.: algo de cozinha" value={w.theme} onChange={set("theme")} disabled={nickLocked} />
      <p className="muted small" style={{ margin: "4px 0 0" }}>
        Os temas de todo mundo vão para um pote e são sorteados junto com as pessoas, então seu tema vai para outra pessoa.
      </p>

      <label htmlFor="avoid">O que evitar no seu presente (regras)</label>
      <textarea id="avoid" maxLength={500} placeholder="Ex.: nada de chocolate (sou alérgico), roupas não, sem bebida alcoólica" value={w.avoid} onChange={set("avoid")} />

      <div className="row" style={{ marginTop: 16 }}>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        )}
        <button disabled={busy}>{busy ? "Salvando..." : submitLabel}</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
