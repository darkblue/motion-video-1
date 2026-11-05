import React from "react";
import { interpolate, spring, useCurrentFrame, AbsoluteFill } from "remotion";
export const C = {
  navy: "#081d2d",
  panel: "#0d2c46",
  cyan: "#4fe2d0",
  white: "#edf6ff",
  muted: "#a4bdce",
  orange: "#ffb967",
  line: "#25475f",
  purple: "#a7b6ff",
};
export const r = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
export const ease = (v: number) => {
  v = Math.max(0, Math.min(1, v));
  return v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2;
};
export const pop = (f: number, d = 0) =>
  spring({ fps: 30, frame: f - d, config: { damping: 24, stiffness: 90 } });
export const T = ({
  x,
  y,
  children,
  size = 28,
  fill = C.white,
  anchor = "start",
  weight = 400,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fill={fill}
    textAnchor={anchor}
    fontWeight={weight}
  >
    {children}
  </text>
);
export const Canvas = ({ children }: { children: React.ReactNode }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);
export const Card = ({
  x,
  y,
  w = 360,
  h = 110,
  cn,
  en,
  active = false,
  color = C.cyan,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  cn: string;
  en?: string;
  active?: boolean;
  color?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      width={w}
      height={h}
      rx={18}
      fill={active ? "#143f50" : C.panel}
      stroke={active ? color : C.line}
      strokeWidth={2}
    />
    <rect
      x={0}
      y={24}
      width={4}
      height={h - 48}
      fill={color}
      opacity={active ? 1 : 0.4}
    />
    <T x={24} y={en ? 44 : h / 2 + 10} size={cn.length > 15 ? 25 : 30}>
      {cn}
    </T>
    {en && (
      <T x={24} y={h - 24} size={en.length > 34 ? 17 : 21} fill={C.muted}>
        {en}
      </T>
    )}
  </g>
);
export const Doc = ({
  x,
  y,
  label,
  en,
  w = 290,
  stamp,
  scale = 1,
}: {
  x: number;
  y: number;
  label: string;
  en?: string;
  w?: number;
  stamp?: string;
  scale?: number;
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect width={w} height={185} rx={14} fill={C.white} />
    <path d={`M${w - 50} 0v45h50`} fill="#bdd5e1" />
    <T x={20} y={48} size={25} fill={C.navy} weight={700}>
      {label}
    </T>
    {en && (
      <T x={20} y={80} size={16} fill="#31556b">
        {en}
      </T>
    )}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M22 ${105 + i * 20}h${w - 65 - i * 15}`}
        stroke="#9fb7c6"
        strokeWidth={5}
      />
    ))}
    {stamp && (
      <g transform={`translate(${w - 100} 122) rotate(-12)`}>
        <rect
          width={85}
          height={42}
          rx={5}
          fill="none"
          stroke={C.orange}
          strokeWidth={4}
        />
        <T x={42} y={29} size={23} anchor="middle" fill="#b76a1b">
          {stamp}
        </T>
      </g>
    )}
  </g>
);
export const Line = ({
  a,
  b,
  f,
  delay = 0,
  color = C.cyan,
  dashed = false,
  file = false,
}: {
  a: [number, number];
  b: [number, number];
  f: number;
  delay?: number;
  color?: string;
  dashed?: boolean;
  file?: boolean;
}) => {
  const u = r(f, delay, delay + 30),
    v = (Math.max(0, f - delay) % 100) / 100;
  return (
    <g opacity={r(f, delay, delay + 10)}>
      <path
        d={`M${a}L${b}`}
        stroke={color}
        strokeWidth={3}
        fill="none"
        pathLength={1}
        strokeDasharray={dashed ? ".018 .014" : 1}
        strokeDashoffset={dashed ? 0 : 1 - u}
      />
      <path
        d={`M${b[0] - 10} ${b[1] - 6}L${b}l-10 6`}
        stroke={color}
        strokeWidth={3}
        fill="none"
      />
      {file && (
        <g
          transform={`translate(${a[0] + (b[0] - a[0]) * v} ${a[1] + (b[1] - a[1]) * v})`}
        >
          <rect x={-12} y={-17} width={24} height={32} rx={3} fill={color} />
          <path
            d="M-6 -8h12m-12 7h12m-12 7h8"
            stroke={C.navy}
            strokeWidth={2}
          />
        </g>
      )}
    </g>
  );
};
export const Flow = ({
  items,
  f,
  x = 110,
  y = 600,
  w = 330,
  gap = 110,
  step = 35,
}: {
  items: string[];
  f: number;
  x?: number;
  y?: number;
  w?: number;
  gap?: number;
  step?: number;
}) => (
  <g>
    {items.map((v, i) => (
      <g key={v}>
        {i > 0 && (
          <Line
            a={[x + (i - 1) * (w + gap) + w, y + 55]}
            b={[x + i * (w + gap) - 12, y + 55]}
            f={f}
            delay={i * step - 10}
            file
          />
        )}
        <g
          opacity={pop(f, i * step)}
          transform={`translate(0 ${18 * (1 - pop(f, i * step))})`}
        >
          <Card
            x={x + i * (w + gap)}
            y={y}
            w={w}
            cn={v.split("|")[0]}
            en={v.split("|")[1]}
            active={f > i * step + 20}
          />
        </g>
      </g>
    ))}
  </g>
);
export const Callout = ({
  x = 110,
  y = 790,
  w = 1700,
  cn,
  en,
  color = C.cyan,
}: {
  x?: number;
  y?: number;
  w?: number;
  cn: string;
  en?: string;
  color?: string;
}) => (
  <g>
    <rect x={x} y={y} width={w} height={en ? 94 : 70} rx={15} fill={C.panel} />
    <rect x={x} y={y} width={5} height={en ? 94 : 70} fill={color} />
    <T x={x + 25} y={y + 40} size={28} fill={color}>
      {cn}
    </T>
    {en && (
      <T x={x + 25} y={y + 74} size={20} fill={C.muted}>
        {en}
      </T>
    )}
  </g>
);
export const Shot = ({
  f,
  children,
}: {
  f: number;
  children: React.ReactNode;
}) => (
  <AbsoluteFill
    style={{
      opacity: r(f, 0, 10),
      transform: `translateY(${8 * (1 - r(f, 0, 16))}px)`,
    }}
  >
    {children}
  </AbsoluteFill>
);
export const useShot = (starts: number[]) => {
  const f = useCurrentFrame();
  const index = starts.reduce((last, s, i) => (f >= s * 30 ? i : last), 0);
  return { f, k: index, t: f - starts[index] * 30 };
};
export const Person = ({
  x,
  y,
  color = C.cyan,
  s = 1,
}: {
  x: number;
  y: number;
  color?: string;
  s?: number;
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cy={-30} r={17} fill={color} />
    <path d="M-30 40v-35q30-35 60 0v35Z" fill={color} opacity={0.65} />
  </g>
);
