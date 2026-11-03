"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = ["#b3261e", "#1f6f4a", "#e0a526", "#2f5d8c", "#c4512d", "#5b8c3a", "#8c3a6b", "#d07a1c"];

type Props = {
  onDone: () => void;
};

/** Quantidade de fatias da roleta. Todas mostram "???": o nome so aparece quando ela para. */
const SLICES = 8;

export default function Wheel({ onDone }: Props) {
  const [idx] = useState(() => Math.floor(Math.random() * SLICES));
  const list = Array.from({ length: SLICES }, () => "???");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const done = useRef(false);

  const n = Math.max(list.length, 1);
  const seg = 360 / n;
  const R = 150;
  const C = 160;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    const center = idx * seg + seg / 2;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    setRotation(360 * 6 + (360 - center) + jitter);
  }

  useEffect(() => {
    if (!spinning) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        onDone();
      }
    }, reduce ? 300 : 5200);
    return () => clearTimeout(t);
  }, [spinning, onDone]);

  const point = (deg: number, r = R) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  return (
    <div className="center">
      <div className="wheel-box">
        <div className="pointer" />
        <svg viewBox="0 0 320 320" role="img" aria-label="Roleta do sorteio">
          <circle cx={C} cy={C} r={R + 6} fill="#2a1f1a" />
          <g
            className="wheel-rot"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 5s cubic-bezier(0.12, 0.7, 0.12, 1)" : "none",
            }}
          >
            {list.map((name, i) => {
              const start = i * seg;
              const end = start + seg;
              const [x1, y1] = point(start);
              const [x2, y2] = point(end);
              const large = seg > 180 ? 1 : 0;
              const mid = start + seg / 2;
              const [tx, ty] = point(mid, R * 0.6);
              const label = name;
              return (
                <g key={i}>
                  {n === 1 ? (
                    <circle cx={C} cy={C} r={R} fill={COLORS[0]} />
                  ) : (
                    <path
                      d={`M${C},${C} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`}
                      fill={COLORS[i % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )}
                  <text
                    x={tx}
                    y={ty}
                    fill="#fff"
                    fontSize={20}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid < 180 ? mid - 90 : mid + 90} ${tx} ${ty})`}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
          <circle cx={C} cy={C} r={22} fill="#fff" stroke="#2a1f1a" strokeWidth={4} />
          <text x={C} y={C + 1} textAnchor="middle" dominantBaseline="middle" fontSize={20}>🎁</text>
        </svg>
      </div>
      <button className="full green" onClick={spin} disabled={spinning}>
        {spinning ? "Girando..." : "🎡 Girar a roleta"}
      </button>
    </div>
  );
}
