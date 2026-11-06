"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAdmin } from "@/lib/client";
import PinInput from "@/components/PinInput";
import BudgetRange, { formatBudget, formatDate, validDate } from "@/components/BudgetRange";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState<[number, number]>([50, 100]);
  const [eventDate, setEventDate] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validDate(eventDate)) {
      setError("Data inválida. Use dia/mês, ex.: 20/12.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, budget: formatBudget(budget), eventDate, adminPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      saveAdmin(data.code, data.adminToken);
      router.push(`/g/${data.code}`);
    } catch (err) {
      setError((err as Error).message || "Algo deu errado.");
      setBusy(false);
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c) router.push(`/g/${c}`);
  }

  return (
    <>
      <div className="hero">
        <div className="emoji">🎡🎁</div>
        <h1>Roleta do Amigo Secreto</h1>
        <p className="muted">
          Sem login. Cada pessoa escolhe um nick, escreve um tema de presente e o que é
          melhor evitar. Depois a roleta sorteia quem tira quem.
        </p>
      </div>

      <form className="card" onSubmit={join}>
        <h2>Já tem um código?</h2>
        <div className="copy">
          <input placeholder="Ex.: K7QX2M" value={code} onChange={(e) => setCode(e.target.value)} maxLength={12} />
          <button type="submit">Entrar</button>
        </div>
      </form>

      <form className="card" onSubmit={create}>
        <h2>Criar um grupo novo</h2>
        <p className="muted small">Quem cria o grupo é quem aperta o botão de sortear.</p>
        <label htmlFor="name">Nome do grupo</label>
        <input id="name" required maxLength={60} placeholder="Amigo secreto da firma" value={name} onChange={(e) => setName(e.target.value)} />
        <label>Valor sugerido</label>
        <BudgetRange value={budget} onChange={setBudget} />
        <label htmlFor="date">Data da troca (opcional)</label>
        <input
          id="date"
          inputMode="numeric"
          placeholder="dd/mm"
          maxLength={5}
          value={eventDate}
          onChange={(e) => setEventDate(formatDate(e.target.value))}
          style={{ maxWidth: 140 }}
        />
        <label htmlFor="adminPin">PIN do organizador (4 números)</label>
        <PinInput id="adminPin" value={adminPin} onChange={setAdminPin} required />
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          Serve para você entrar como organizador de outro aparelho. Não é o PIN de participante.
        </p>
        <button className="full" disabled={busy}>{busy ? "Criando..." : "Criar grupo"}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </>
  );
}
