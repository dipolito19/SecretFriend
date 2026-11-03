"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CopyField from "@/components/CopyField";
import Wheel from "@/components/Wheel";
import WishesForm from "@/components/WishesForm";
import { api, loadAdmin, loadToken, saveAdmin, saveToken } from "@/lib/client";
import type { GroupView, Wishes } from "@/lib/types";

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

  async function join(w: Wishes) {
    const { token: t } = await api<{ token: string }>(`/api/groups/${code}/participants`, { method: "POST", body: w });
    saveToken(code, t);
    setToken(t);
  }

  async function save(w: Wishes) {
    await api(`/api/groups/${code}/participants`, { method: "PATCH", body: w, token });
    setEditing(false);
    await refresh();
  }

  async function remove(id: string | null, nick: string) {
    const isMe = id === null;
    if (!confirm(isMe ? "Sair do grupo? Seus desejos serão apagados." : `Remover ${nick} do grupo?`)) return;
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
  const others = view.participants.filter((p) => p.id !== view.me?.id);
  const matchIndex = view.match ? others.findIndex((p) => p.id === view.match!.id) : -1;

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
              <h2>Quem você tirou?</h2>
              <p className="muted">Gire a roleta para descobrir. Não deixe ninguém olhar a tela 👀</p>
              <Wheel names={others.map((p) => p.nick)} target={Math.max(matchIndex, 0)} onDone={onRevealed} />
            </>
          ) : (
            <>
              <p className="muted">Seu amigo secreto é</p>
              <div className="nick">🎉 {view.match.nick}</div>
              <div style={{ textAlign: "left" }}>
                <h3>Gostaria de ganhar</h3>
                <ol className="wishlist">
                  <li>{view.match.category_1}</li>
                  <li>{view.match.category_2}</li>
                  <li>{view.match.category_3}</li>
                </ol>
                <h3 style={{ marginTop: 16 }}>Evite</h3>
                <div className="avoid">{view.match.avoid || "Nenhuma regra, pode ousar 😄"}</div>
              </div>
              <p className="muted small" style={{ marginTop: 12 }}>
                Se {view.match.nick} mudar os desejos, você vê a versão nova aqui.
              </p>
            </>
          )}
        </div>
      )}

      {view.drawn && !view.me && (
        <div className="card center">
          <h2>O sorteio já foi feito</h2>
          <p className="muted">
            Se você participou por outro aparelho, abra o seu link pessoal para ver quem tirou.
          </p>
        </div>
      )}

      {/* Entrar */}
      {!view.drawn && !view.me && (
        <div className="card">
          <h2>Entrar no grupo</h2>
          <p className="muted small">Sem login: só um nick e o que você curte.</p>
          <WishesForm submitLabel="Entrar no amigo secreto" onSubmit={join} />
        </div>
      )}

      {/* Meus desejos */}
      {view.me && (
        <div className="card">
          <div className="split">
            <h2 style={{ margin: 0 }}>Seus desejos</h2>
            {!editing && <button className="link" onClick={() => setEditing(true)}>Editar</button>}
          </div>
          {editing ? (
            <WishesForm
              initial={view.me}
              nickLocked={view.drawn}
              submitLabel="Salvar"
              onSubmit={save}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <p className="muted small" style={{ marginTop: 6 }}>Você entrou como <b>{view.me.nick}</b></p>
              <ol className="wishlist">
                <li>{view.me.category_1}</li>
                <li>{view.me.category_2}</li>
                <li>{view.me.category_3}</li>
              </ol>
              {view.me.avoid && <div className="avoid" style={{ marginTop: 8 }}>🚫 {view.me.avoid}</div>}
            </>
          )}
          <hr />
          <p className="small"><b>Seu link pessoal.</b> Guarde para abrir em outro aparelho. Não compartilhe: ele mostra quem você tirou.</p>
          <CopyField value={myLink} />
        </div>
      )}

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
            <p className="ok">Sorteio feito! Cada pessoa abre o grupo e gira a roleta para ver quem tirou.</p>
          ) : (
            <>
              <p className="muted small">
                Quando todo mundo tiver entrado, sorteie. Ninguém tira a si mesmo e nem você vê os pares.
              </p>
              <button className="full" onClick={draw} disabled={drawing || view.participants.length < 3}>
                {drawing ? "Sorteando..." : "🎲 Fazer o sorteio"}
              </button>
              {view.participants.length < 3 && <p className="muted small center" style={{ marginTop: 8 }}>Precisa de pelo menos 3 pessoas.</p>}
              {drawError && <p className="error">{drawError}</p>}
            </>
          )}
          <hr />
          <p className="small"><b>Link de organizador</b> (para abrir em outro aparelho, não compartilhe):</p>
          <CopyField value={adminLink} />
        </div>
      )}

      {!view.drawn && view.me && !view.isAdmin && (
        <p className="center muted">⏳ Aguardando o organizador fazer o sorteio.</p>
      )}
    </>
  );
}
