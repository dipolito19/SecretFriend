"use client";

import { useState } from "react";
import type { Wishes } from "@/lib/types";
import PinInput from "./PinInput";

export type WishesWithPin = Wishes & { pin: string };

type Props = {
  initial?: Partial<Wishes>;
  nickLocked?: boolean;
  submitLabel: string;
  /** "new": PIN obrigatorio (cadastro). "change": PIN opcional (so troca se preencher). */
  pinMode: "new" | "change";
  onSubmit: (w: WishesWithPin) => Promise<void>;
  onCancel?: () => void;
};

export default function WishesForm({ initial = {}, nickLocked, pinMode, submitLabel, onSubmit, onCancel }: Props) {
  const [pin, setPin] = useState("");
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
      await onSubmit({ ...w, pin });
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

      <label htmlFor="pin">{pinMode === "new" ? "Crie um PIN de 4 números" : "Trocar PIN (deixe vazio para manter)"}</label>
      <PinInput id="pin" value={pin} onChange={setPin} required={pinMode === "new"} />
      {pinMode === "new" && (
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          Com seu nick e esse PIN você entra de qualquer celular ou computador. Não conte para ninguém.
        </p>
      )}

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
