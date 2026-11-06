"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CopyField from "@/components/CopyField";
import Wheel from "@/components/Wheel";
import WishesForm, { type WishesWithPin } from "@/components/WishesForm";
import LoginCard from "@/components/LoginCard";
import PinInput from "@/components/PinInput";
import { api, loadAdmin, loadToken, saveAdmin, saveToken } from "@/lib/client";
import type { GroupView } from "@/lib/types";

const revealKey = (code: string) => `roleta:r:${code}`;

export default function GroupPage({ code }: { code: string }) {
  const [view, setView] = useState<GroupView | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading");
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [drawError, setDrawError] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState("");
  const [origin, setOrigin] = useState("");

  // Le tokens do link (?p= / ?admin=) e do navegador.
  useEffect(() => {
    const url = new URL(window.location.href);
    const p = url.searchParams.get("p");
    const a = url.searchParams.get("admin");
    if (p) saveToken(code, p);
    if (a) saveAdmin(code, a);
    if (p || a) window.history.replaceState(null, "", url.pathname);
    setToken(loadToken(code));
    setAdmin(loadAdmin(code));
    try { setRevealed(localStorage.getItem(revealKey(code)) === "1"); } catch {}
    setOrigin(window.location.origin);
    setReady(true);
  }, [code]);

  const refresh = useCallback(async () => {
    try {
      const v = await api<GroupView>(`/api/groups/${code}`, { token, admin });
      setView(v);
      setStatus("ok");
      // Token salvo que nao existe mais (removido do grupo): esquece.
      if (token && !v.me) {
        saveToken(code, null);
        setToken(null);
      }
    } catch (e) {
      setStatus((e as { status?: number }).status === 404 ? "missing" : "error");
    }
  }, [code, token, admin]);

  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);

  // Enquanto o sorteio nao acontece, atualiza a cada 8s.
  useEffect(() => {
    if (!view || view.drawn) return;
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [view, refresh]);

  function loginParticipant(t: string) {
    saveToken(code, t);
    setToken(t);
  }

  function loginOrganizer(a: string) {
    saveAdmin(code, a);
    setAdmin(a);
  }

  function logout() {
    if (!confirm("Sair deste aparelho? Para voltar, use seu nick e PIN.")) return;
    saveToken(code, null);
    setToken(null);
  }

  async function setOrganizerPin(e: React.FormEvent) {
    e.preventDefault();
    setDrawError("");
    try {
      await api(`/api/groups/${code}`, { method: "PATCH", body: { adminPin: newAdminPin }, admin });
      setNewAdminPin("");
      await refresh();
    } catch (err) {
      setDrawError((err as Error).message);
    }
  }

  async function join(w: WishesWithPin) {
    const { token: t } = await api<{ token: string }>(`/api/groups/${code}/participants`, { method: "POST", body: w });
    saveToken(code, t);
    setToken(t);
  }

  async function save(w: WishesWithPin) {
    await api(`/api/groups/${code}/participants`, { method: "PATCH", body: w, token });
    setEditing(false);
    await refresh();
  }

  async function remove(id: string | null, nick: string) {
    const isMe = id === null;
    if (!confirm(isMe ? "Sair do grupo? Seu tema e suas regras serão apagados." : `Remover ${nick} do grupo?`)) return;
    await api(`/api/groups/${code}/participants`, {
      method: "DELETE",
      body: isMe ? {} : { id },
      token: isMe ? token : null,
      admin: isMe ? null : admin,
    }).catch((e) => alert(e.message));
    if (isMe) {
      saveToken(code, null);
      setToken(null);
    } else {
      refresh();
    }
  }

  async function revealThemes() {
    if (!view) return;
    if (!confirm(`Revelar o pote com ${view.participants.length} temas para todo mundo? Não dá para esconder de novo.`)) return;
    setRevealing(true);
    setDrawError("");
    try {
      await api(`/api/groups/${code}/reveal`, { method: "POST", admin });
      await refresh();
    } catch (e) {
      setDrawError((e as Error).message);
    } finally {
      setRevealing(false);
    }
  }

  async function draw() {
    if (!view) return;
    if (!confirm(`Sortear agora com ${view.participants.length} pessoas? Depois disso ninguém mais entra.`)) return;
    setDrawing(true);
    setDrawError("");
    try {
      await api(`/api/groups/${code}/draw`, { method: "POST", admin });
      await refresh();
    } catch (e) {
      setDrawError((e as Error).message);
    } finally {
      setDrawing(false);
    }
  }

  const onRevealed = useCallback(() => {
    setRevealed(true);
    try { localStorage.setItem(revealKey(code), "1"); } catch {}
  }, [code]);

  if (status === "loading") return <p className="center muted">Carregando...</p>;
  if (status === "missing")
    return (
      <div className="card center">
        <h2>Grupo não encontrado</h2>
        <p className="muted">Confira o código <b>{code}</b>.</p>
        <Link href="/">Voltar para o início</Link>
      </div>
    );
  if (status === "error" || !view)
    return (
      <div className="card center">
        <h2>Não consegui carregar o grupo</h2>
        <button onClick={refresh}>Tentar de novo</button>
      </div>
    );

  const shareLink = `${origin}/g/${view.code}`;
  const myLink = token ? `${origin}/g/${view.code}?p=${token}` : "";
  const adminLink = admin ? `${origin}/g/${view.code}?admin=${admin}` : "";

  return (
    <>
      <div className="hero">
        <Link href="/" className="muted small">← início</Link>
        <h1 style={{ marginTop: 8 }}>{view.name}</h1>
        <p className="muted">
          {[view.budget && `💰 ${view.budget}`, view.eventDate && `📅 ${view.eventDate}`].filter(Boolean).join("  ·  ")}
        </p>
        {view.drawn ? <span className="badge">Sorteio feito ✓</span> : <div className="code">{view.code}</div>}
      </div>

      {/* Resultado */}
      {view.drawn && view.me && view.match && (
        <div className="card reveal">
          {!revealed ? (
            <>
              <h2>Quem e qual tema você tirou?</h2>
              <p className="muted">Gire a roleta para descobrir. Não deixe ninguém olhar a tela 👀</p>
              <Wheel onDone={onRevealed} />
            </>
          ) : (
            <>
              <p className="muted">Seu amigo secreto é</p>
              <div className="nick">🎉 {view.match.nick}</div>
              <p className="muted" style={{ marginBottom: 4 }}>e o tema do presente é</p>
              <div className="theme">🎁 {view.match.theme}</div>
              <div style={{ textAlign: "left" }}>
                <h3 style={{ marginTop: 16 }}>Regras de {view.match.nick}: evite</h3>
                <div className="avoid">{view.match.avoid || "Nenhuma regra, pode ousar 😄"}</div>
              </div>
              <p className="muted small" style={{ marginTop: 12 }}>
                Se {view.match.nick} mudar as regras, você vê a versão nova aqui.
              </p>
            </>
          )}
        </div>
      )}

      {view.drawn && !view.me && (
        <div className="card center">
          <h2>O sorteio já foi feito</h2>
          <p className="muted">Entre com seu nick e PIN para ver quem e qual tema você tirou.</p>
        </div>
      )}

      {/* Entrar */}
      {!view.drawn && !view.me && (
        <div className="card">
          <h2>Entrar no grupo</h2>
          <p className="muted small">Sem login: só um nick, um tema de presente e o que evitar.</p>
          <WishesForm pinMode="new" submitLabel="Entrar no amigo secreto" onSubmit={join} />
        </div>
      )}

      {/* Entrar de outro aparelho */}
      {(!view.me || !view.isAdmin) && (
        <LoginCard
          key={`${!!view.me}-${view.isAdmin}`}
          code={view.code}
          participant={!view.me}
          organizer={!view.isAdmin}
          startOpen={view.drawn}
          onParticipant={loginParticipant}
          onOrganizer={loginOrganizer}
        />
      )}

      {/* Meus desejos */}
      {view.me && (
        <div className="card">
          <div className="split">
            <h2 style={{ margin: 0 }}>Sua participação</h2>
            {!editing && <button className="link" onClick={() => setEditing(true)}>Editar</button>}
          </div>
          {editing ? (
            <WishesForm
              initial={view.me}
              nickLocked={view.drawn}
              pinMode="change"
              submitLabel="Salvar"
              onSubmit={save}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <p className="muted small" style={{ marginTop: 6 }}>Você entrou como <b>{view.me.nick}</b></p>
              <ul className="wishlist plain">
                <li>{view.me.theme}</li>
              </ul>
              {view.me.avoid && <div className="avoid" style={{ marginTop: 8 }}>🚫 {view.me.avoid}</div>}
            </>
          )}
          <hr />
          {view.me.hasPin ? (
            <p className="small">
              🔑 Para entrar de outro aparelho, use seu nick <b>{view.me.nick}</b> e seu PIN.
            </p>
          ) : (
            <p className="small">
              ⚠️ Você ainda não tem PIN. Clique em <b>Editar</b> e crie um para entrar de outros aparelhos.
            </p>
          )}
          <details className="small">
            <summary className="muted">Ou use seu link pessoal</summary>
            <p className="muted small" style={{ marginTop: 6 }}>Não compartilhe: ele mostra quem você tirou.</p>
            <CopyField value={myLink} />
          </details>
          <button className="linkish small" style={{ marginTop: 12 }} onClick={logout}>Sair deste aparelho</button>
        </div>
      )}

      {/* Temas do pote */}
      <div className="card">
        {!view.themesRevealed ? (
          <>
            <h2 style={{ margin: 0 }}>Temas no pote 🔒</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              O organizador vai revelar o pote quando todo mundo tiver entrado.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ margin: 0 }}>Temas no pote ({view.themes.length})</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              Todos os temas cadastrados até agora. Ninguém sabe quem escreveu cada um, e no sorteio cada pessoa recebe um deles.
            </p>
            <ul className="chips">
              {view.themes.map((t, i) => (
                <li key={i} className="chip theme-chip">🎁 {t}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Participantes */}
      <div className="card">
        <div className="split">
          <h2 style={{ margin: 0 }}>Participantes ({view.participants.length})</h2>
          {!view.drawn && <span className="muted small">atualiza sozinho</span>}
        </div>
        {view.participants.length === 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>Ninguém entrou ainda. Mande o link!</p>
        ) : (
          <ul className="chips">
            {view.participants.map((p) => {
              const isMe = p.id === view.me?.id;
              const canRemove = !view.drawn && (isMe || view.isAdmin);
              return (
                <li key={p.id} className={`chip${isMe ? " me" : ""}`}>
                  {p.nick}{isMe && " (você)"}
                  {canRemove && (
                    <button title={isMe ? "Sair do grupo" : "Remover"} onClick={() => remove(isMe ? null : p.id, p.nick)}>×</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!view.drawn && (
          <>
            <hr />
            <p className="small"><b>Convide a galera</b> com este link:</p>
            <CopyField value={shareLink} />
          </>
        )}
      </div>

      {/* Organizador */}
      {view.isAdmin && (
        <div className="card">
          <h2>Área do organizador</h2>
          {view.drawn ? (
            <p className="ok">Sorteio feito! Cada pessoa abre o grupo e gira a roleta para ver quem e qual tema tirou.</p>
          ) : (
            <>
              <p className="muted small">
                Quando todo mundo tiver entrado, sorteie. Cada pessoa recebe um amigo e um tema aleatórios. Ninguém tira a si mesmo nem o próprio tema, e nem você vê o resultado.
              </p>
              {!view.themesRevealed && (
                <button className="full green" onClick={revealThemes} disabled={revealing || view.participants.length < 3}>
                  {revealing ? "Revelando..." : "🔓 Revelar pote de temas"}
                </button>
              )}
              <button className="full" onClick={draw} disabled={drawing || view.participants.length < 3}>
                {drawing ? "Sorteando..." : "🎲 Fazer o sorteio"}
              </button>
              {view.participants.length < 3 && <p className="muted small center" style={{ marginTop: 8 }}>Precisa de pelo menos 3 pessoas.</p>}
              {drawError && <p className="error">{drawError}</p>}
            </>
          )}
          <hr />
          {view.hasAdminPin ? (
            <p className="small">🔑 Para entrar como organizador em outro aparelho, use “Sou o organizador” e o PIN do organizador.</p>
          ) : (
            <form onSubmit={setOrganizerPin}>
              <p className="small">⚠️ Este grupo ainda não tem PIN de organizador. Crie um para entrar de outros aparelhos:</p>
              <div className="copy">
                <PinInput id="new-admin-pin" value={newAdminPin} onChange={setNewAdminPin} required />
                <button disabled={newAdminPin.length !== 4}>Salvar PIN</button>
              </div>
            </form>
          )}
          <details className="small" style={{ marginTop: 8 }}>
            <summary className="muted">Ou use o link de organizador</summary>
            <CopyField value={adminLink} />
          </details>
        </div>
      )}

      {!view.drawn && view.me && !view.isAdmin && (
        <p className="center muted">⏳ Aguardando o organizador fazer o sorteio.</p>
      )}
    </>
  );
}
