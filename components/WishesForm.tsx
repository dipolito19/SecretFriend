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
    category_1: initial.category_1 ?? "",
    category_2: initial.category_2 ?? "",
    category_3: initial.category_3 ?? "",
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

      <label>3 categorias de presente que você gostaria de ganhar</label>
      <input aria-label="Categoria 1" required maxLength={60} placeholder="Ex.: livros de fantasia" value={w.category_1} onChange={set("category_1")} />
      <input aria-label="Categoria 2" required maxLength={60} placeholder="Ex.: café especial" value={w.category_2} onChange={set("category_2")} style={{ marginTop: 8 }} />
      <input aria-label="Categoria 3" required maxLength={60} placeholder="Ex.: coisas de cozinha" value={w.category_3} onChange={set("category_3")} style={{ marginTop: 8 }} />

      <label htmlFor="avoid">O que evitar (regras)</label>
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
