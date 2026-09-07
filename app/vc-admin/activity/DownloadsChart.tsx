"use client";

import { useState } from "react";

export type DayPoint = { date: string; label: string; count: number };

const W = 720;
const H = 170;
const PAD = { top: 12, right: 8, bottom: 22, left: 30 };

/**
 * Downloads-per-day bar chart (single series — the title names it, no legend).
 * Plain SVG: thin bars with rounded data-ends anchored to the baseline, a 2px
 * gap between bars, recessive gridlines, and a per-day hover tooltip with a
 * full-height hit target.
 */
export default function DownloadsChart({ days }: { days: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = Math.max(1, ...days.map((d) => d.count));
  // Recessive y-grid: 2–4 whole-number lines.
  const step = max <= 4 ? 1 : Math.ceil(max / 4);
  const gridVals: number[] = [];
  for (let v = step; v <= max; v += step) gridVals.push(v);

  const slot = plotW / days.length;
  const barW = Math.max(2, Math.min(18, slot - 2)); // 2px surface gap
  const x = (i: number) => PAD.left + i * slot + (slot - barW) / 2;
  const y = (v: number) => PAD.top + plotH * (1 - v / max);

  // Sparse x labels: ~5 ticks.
  const every = Math.max(1, Math.ceil(days.length / 5));

  const hovered = hover !== null ? days[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Downloads per day, ${days.length} days`}
        className="w-full h-auto block"
        onMouseLeave={() => setHover(null)}
      >
        {gridVals.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--muted)"
            >
              {v}
            </text>
          </g>
        ))}
        {/* baseline */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          stroke="var(--border-strong)"
          strokeWidth="1"
        />
        {days.map((d, i) => {
          const h = (d.count / max) * plotH;
          const r = Math.min(4, barW / 2, h); // rounded data-end only
          return (
            <g key={d.date}>
              {d.count > 0 && (
                <path
                  className="chart-fill"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  d={`M ${x(i)} ${PAD.top + plotH}
                      v ${-(h - r)}
                      q 0 ${-r} ${r} ${-r}
                      h ${barW - 2 * r}
                      q ${r} 0 ${r} ${r}
                      v ${h - r} z`}
                />
              )}
              {/* full-height hit target */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {i % every === 0 && (
                <text
                  x={x(i) + barW / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        {hovered && hover !== null && (
          <line
            x1={x(hover) + barW / 2}
            x2={x(hover) + barW / 2}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1"
            pointerEvents="none"
          />
        )}
      </svg>
      {hovered && hover !== null && (
        <div
          className="absolute pointer-events-none border hairline px-2.5 py-1.5 text-xs whitespace-nowrap"
          style={{
            background: "var(--bg)",
            left: `${((x(hover) + barW / 2) / W) * 100}%`,
            top: 0,
            transform: `translateX(${hover > days.length / 2 ? "-110%" : "10%"})`,
          }}
        >
          <span className="text-muted">{hovered.label}</span>{" "}
          <strong className="text-fg">
            {hovered.count} download{hovered.count === 1 ? "" : "s"}
          </strong>
        </div>
      )}
    </div>
  );
}
