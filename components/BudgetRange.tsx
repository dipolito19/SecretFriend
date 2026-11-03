"use client";

const MIN = 0;
const MAX = 500;
const STEP = 10;

type Props = {
  value: [number, number];
  onChange: (v: [number, number]) => void;
};

export const formatBudget = ([lo, hi]: [number, number]) => (lo === hi ? `R$ ${lo}` : `R$ ${lo} a R$ ${hi}`);

/** Arrastavel com duas alcas para escolher a faixa de valor. */
export default function BudgetRange({ value, onChange }: Props) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  return (
    <div className="range">
      <div className="range-value">{formatBudget(value)}</div>
      <div className="range-track">
        <div className="range-fill" style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
        <input
          type="range"
          aria-label="Valor mínimo"
          min={MIN}
          max={MAX}
          step={STEP}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          style={{ zIndex: lo > MAX - 50 ? 3 : 2 }}
        />
        <input
          type="range"
          aria-label="Valor máximo"
          min={MIN}
          max={MAX}
          step={STEP}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        />
      </div>
      <div className="range-scale"><span>R$ {MIN}</span><span>R$ {MAX}</span></div>
    </div>
  );
}

/** 2012 -> 20/12. Aceita so numeros. */
export function formatDate(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function validDate(v: string) {
  if (!v) return true;
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const day = Number(m[1]);
  const month = Number(m[2]);
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}
