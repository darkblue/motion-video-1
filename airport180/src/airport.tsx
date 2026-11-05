import React from "react";
import project from "./data/airport-project.json";
import cameraData from "./data/camera-keyframes.json";
import { C, ease, r } from "./ui";
type V = [number, number, number];
const dot = (a: V, b: V) => a.reduce((s, v, i) => s + v * b[i], 0);
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: V): V => a.map((x) => x / Math.hypot(...a)) as V;
export const facilities = project.objects.filter(
  (o) => o.kind !== "illustrative_clearance",
);
export const dimensions = (o: (typeof project.objects)[number]) => {
  const g: any = o.geometry;
  return g.type === "rect"
    ? [g.x, g.y, g.width, g.height]
    : g.type === "circle"
      ? [g.cx - g.r, g.cy - g.r, g.r * 2, g.r * 2]
      : [
          Math.min(...g.points.map((v: number[]) => v[0])) - g.stroke_width / 2,
          Math.min(...g.points.map((v: number[]) => v[1])) - g.stroke_width / 2,
          Math.max(...g.points.map((v: number[]) => v[0])) -
            Math.min(...g.points.map((v: number[]) => v[0])) +
            g.stroke_width,
          Math.max(...g.points.map((v: number[]) => v[1])) -
            Math.min(...g.points.map((v: number[]) => v[1])) +
            g.stroke_width,
        ];
};
export const height = (kind: string) =>
  kind === "terminal"
    ? 90
    : kind === "tower"
      ? 100
      : kind === "parking"
        ? 24
        : kind === "transport_hub"
          ? 20
          : 0;
export const pose = (sid: string, u: number) => {
  const specs: any = cameraData.cameras;
  const d = specs[sid] || specs["S07-SH21"];
  u = ease(u);
  const a = d.start,
    b = d.end;
  const m = (k: string, fallback = 0) =>
    (a[k] ?? fallback) + ((b[k] ?? fallback) - (a[k] ?? fallback)) * u;
  const target = a.target_xyz_m.map(
    (x: number, i: number) => x + (b.target_xyz_m[i] - x) * u,
  ) as V;
  return {
    target,
    az: (m("azimuth_deg") * Math.PI) / 180,
    el: (m("elevation_deg") * Math.PI) / 180,
    scale: m("ortho_scale_m", 5000),
    distance: m("distance_m", 10000),
    perspective: d.camera_type === "PERSPECTIVE",
    lens: d.lens_mm || 50,
  };
};
export const projector = (
  sid: string,
  u: number,
  viewport: { x: number; y: number; w: number; h: number },
  fit = 1,
) => {
  const p = pose(sid, u),
    offset: V = [
      Math.cos(p.el) * Math.cos(p.az),
      -Math.cos(p.el) * Math.sin(p.az),
      Math.sin(p.el),
    ],
    forward = offset.map((x) => -x) as V,
    upRef: V = [0, 1, 0],
    right = norm(cross(forward, upRef)),
    up = norm(cross(right, forward)),
    target: V = [p.target[0], -p.target[1], p.target[2]];
  return (xyz: V): [number, number] => {
    const d = sub([xyz[0], -xyz[1], xyz[2]], target);
    const unit = p.perspective
      ? (viewport.w * p.lens) /
        (36 * Math.max(100, p.distance * fit + dot(d, forward)))
      : viewport.w / (p.scale * fit);
    return [
      viewport.x + viewport.w / 2 + dot(d, right) * unit,
      viewport.y + viewport.h / 2 - dot(d, up) * unit,
    ];
  };
};
export const Airport = ({
  sid = "S07-SH21",
  u = 0,
  build = 1,
  night = false,
  x = 80,
  y = 220,
  w = 1300,
  h = 620,
  fit = 1.05,
}: {
  sid?: string;
  u?: number;
  build?: number;
  night?: boolean;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  fit?: number;
}) => {
  const projectPoint = projector(sid, u, { x, y, w, h }, fit);
  const path = (v: V[]) => v.map((a) => projectPoint(a).join(",")).join(" ");
  return (
    <g data-airport-model="NIA-15M-fixed-geometry">
      <polygon
        points={path([
          [650, 650, -8],
          [4600, 650, -8],
          [4600, 3200, -8],
          [650, 3200, -8],
        ])}
        fill={night ? "#102e3b" : "#163d4b"}
        stroke={C.line}
      />
      {facilities.map((o) => {
        const [a, b, c, d] = dimensions(o),
          z = height(o.kind),
          stage =
            o.kind === "runway"
              ? 0
              : o.kind === "taxiway"
                ? 0.12
                : o.kind === "apron" || o.kind === "taxilane"
                  ? 0.25
                  : o.kind === "terminal"
                    ? 0.4
                    : 0.65;
        const alpha = r(build, stage, stage + 0.16);
        const q: V[] =
            o.kind === "tower"
              ? Array.from(
                  { length: 16 },
                  (_, i) =>
                    [
                      a + c / 2 + (c / 2) * Math.cos((i * Math.PI) / 8),
                      b + d / 2 + (d / 2) * Math.sin((i * Math.PI) / 8),
                      0,
                    ] as V,
                )
              : [
                  [a, b, 0],
                  [a + c, b, 0],
                  [a + c, b + d, 0],
                  [a, b + d, 0],
                ],
          top = q.map((v) => [v[0], v[1], z] as V);
        const color =
          o.kind === "terminal"
            ? C.cyan
            : o.kind === "tower"
              ? C.orange
              : o.kind === "runway"
                ? "#243a49"
                : o.kind === "taxiway" || o.kind === "taxilane"
                  ? "#597c8d"
                  : o.kind === "apron"
                    ? "#88a9b9"
                    : o.kind === "transport_hub"
                      ? "#4c9b9c"
                      : "#44728d";
        return (
          <g key={o.id} data-facility-id={o.id} opacity={alpha}>
            {z > 0 &&
              q.map((_, i) => (
                <polygon
                  key={i}
                  points={path([
                    q[i],
                    q[(i + 1) % q.length],
                    top[(i + 1) % q.length],
                    top[i],
                  ])}
                  fill={color}
                  opacity={0.42 + (i % 4) * 0.1}
                />
              ))}
            <polygon
              points={path(top)}
              fill={color}
              stroke="#84b4c4"
              strokeWidth={0.65}
            />
            {o.kind === "runway" && (
              <polyline
                points={path([
                  [a + 100, b + d / 2, 0.5],
                  [a + c - 100, b + d / 2, 0.5],
                ])}
                stroke={C.white}
                strokeWidth={2.3}
                strokeDasharray="15 12"
              />
            )}
            {o.kind === "terminal" &&
              Array.from({ length: 16 }, (_, i) => (
                <polyline
                  key={i}
                  points={path([
                    [a + 40 + i * 85, b, z + 1],
                    [a + 40 + i * 85, b + d, z + 1],
                  ])}
                  stroke="#c6fff6"
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              ))}
            {o.kind === "apron" &&
              Array.from({ length: 6 }, (_, i) => (
                <polyline
                  key={i}
                  points={path([
                    [2005 + i * 210, 1800, 1],
                    [2005 + i * 210, 1990, 1],
                  ])}
                  stroke={C.white}
                  strokeWidth={1.7}
                />
              ))}
            {o.kind === "parking" &&
              Array.from({ length: 12 }, (_, i) => (
                <polyline
                  key={i}
                  points={path([
                    [a + 20 + i * 42, b + 25, z + 1],
                    [a + 20 + i * 42, b + d - 25, z + 1],
                  ])}
                  stroke="#bbd4df"
                  strokeWidth={1}
                />
              ))}
          </g>
        );
      })}
      {night &&
        Array.from({ length: 26 }, (_, i) => {
          const p = projectPoint([1100 + i * 120, 1000, 3]);
          return <circle key={i} cx={p[0]} cy={p[1]} r={2.3} fill={C.orange} />;
        })}
    </g>
  );
};
