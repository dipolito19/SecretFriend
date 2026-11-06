"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import PinInput from "./PinInput";

type Props = {
  code: string;
  /** Mostrar a opcao de entrar como participante (nick + PIN). */
  participant: boolean;
  /** Mostrar a opcao de entrar como organizador (PIN do organizador). */
  organizer: boolean;
  /** Ja abre o formulario de participante (ex.: depois do sorteio). */
  startOpen?: boolean;
  onParticipant: (token: string) => void;
  onOrganizer: (adminToken: string) => void;
};

/** "Ja participo": entra de qualquer aparelho com nick + PIN (ou PIN do organizador). */
export default function LoginCard({ code, participant, organizer, startOpen, onParticipant, onOrganizer }: Props) {
  const [mode, setMode] = useState<"closed" | "participant" | "organizer">(startOpen && participant ? "participant" : "closed");
  const [nick, setNick] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function open(m: "participant" | "organizer") {
    setMode(m);
    setPin("");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "organizer") {
        const r = await api<{ adminToken: string }>(`/api/groups/${code}/login`, { method: "POST", body: { organizer: true, pin } });
        onOrganizer(r.adminToken);
      } else {
        const r = await api<{ token: string }>(`/api/groups/${code}/login`, { method: "POST", body: { nick, pin } });
        onParticipant(r.token);
      }
      setMode("closed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "closed") {
    return (
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Já participa?</h2>
        <p className="muted small">Entre de qualquer celular ou computador.</p>
        <div className="row" style={{ marginTop: 8 }}>
          {participant && <button className="secondary" onClick={() => open("participant")}>Entrar com nick e PIN</button>}
          {organizer && <button className="secondary" onClick={() => open("organizer")}>Sou o organizador</button>}
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{ marginBottom: 4 }}>{mode === "organizer" ? "Entrar como organizador" : "Entrar com nick e PIN"}</h2>
      {mode === "participant" && (
        <>
          <label htmlFor="login-nick">Seu nick</label>
          <input id="login-nick" required minLength={2} maxLength={30} value={nick} onChange={(e) => setNick(e.target.value)} autoComplete="username" />
        </>
      )}
      <label htmlFor="login-pin">{mode === "organizer" ? "PIN do organizador" : "Seu PIN"}</label>
      <PinInput id="login-pin" value={pin} onChange={setPin} required />
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="secondary" onClick={() => setMode("closed")}>Cancelar</button>
        <button disabled={busy || pin.length !== 4}>{busy ? "Entrando..." : "Entrar"}</button>
      </div>
      {error && <p className="error">{error}</p>}
      {mode === "participant" && organizer && (
        <button type="button" className="linkish small" style={{ marginTop: 12 }} onClick={() => open("organizer")}>
          Sou o organizador
        </button>
      )}
      {mode === "organizer" && participant && (
        <button type="button" className="linkish small" style={{ marginTop: 12 }} onClick={() => open("participant")}>
          Entrar como participante
        </button>
      )}
    </form>
  );
}
