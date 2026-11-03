"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAdmin } from "@/lib/client";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, budget, eventDate }),
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
          Sem login. Cada pessoa escolhe um nick, conta 3 tipos de presente que gostaria de ganhar e o que é
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
        <div className="row">
          <div>
            <label htmlFor="budget">Valor sugerido (opcional)</label>
            <input id="budget" maxLength={40} placeholder="R$ 50 a R$ 100" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div>
            <label htmlFor="date">Data da troca (opcional)</label>
            <input id="date" maxLength={40} placeholder="20/12" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
        </div>
        <button className="full" disabled={busy}>{busy ? "Criando..." : "Criar grupo"}</button>
        {error && <p className="error">{error}</p>}
      </form>
    </>
  );
}
