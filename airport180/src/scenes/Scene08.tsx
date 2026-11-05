import cfg from "../config/scene08.json";
import React from "react";
import {
  Canvas,
  C,
  T,
  Card,
  Doc,
  Flow,
  Shot,
  Person,
  useShot,
  r,
  pop,
} from "../ui";
import { Airport, projector } from "../airport";
export const Scene08 = () => {
  const { k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  const u = t / 119;
  const project = projector(
    "S08-SH25",
    u,
    { x: 20, y: 180, w: 1280, h: 620 },
    1.15,
  );
  const p = project([1200 + 2800 * r(t, 10, 110), 1017.5, 150 * r(t, 65, 119)]),
    q = project([1400 + 2800 * r(t, 10, 110), 1017.5, 150 * r(t, 65, 119)]);
  const angle = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
  return (
    <Shot f={t}>
      <Canvas>
        {k === 0 ? (
          <>
            {cfg.content.opening_gates.map((v, i) => (
              <g key={v} opacity={pop(t, i * 18)}>
                <circle cx={180} cy={275 + i * 103} r={22} fill={C.cyan} />
                <T
                  x={180}
                  y={284 + i * 103}
                  size={27}
                  anchor="middle"
                  fill={C.navy}
                >
                  ✓
                </T>
                <T x={230} y={285 + i * 103} size={31}>
                  {v.split("|")[0]}
                </T>
                <T x={230} y={320 + i * 103} size={21} fill={C.muted}>
                  {v.split("|")[1]}
                </T>
              </g>
            ))}
            <T x={1100} y={280} size={34} fill={C.orange}>
              ORAT提前启动，并与建设交叉推进
            </T>
            <T x={1100} y={335} size={24} fill={C.muted}>
              运营准备 / Operational Readiness
            </T>
            {cfg.content.passenger_journey.map((v, i) => (
              <g key={v}>
                <rect
                  x={1080 + (i % 2) * 360}
                  y={420 + Math.floor(i / 2) * 180}
                  width={300}
                  height={120}
                  rx={18}
                  fill={C.panel}
                />
                <T
                  x={1230 + (i % 2) * 360}
                  y={492 + Math.floor(i / 2) * 180}
                  anchor="middle"
                  size={32}
                >
                  {v}
                </T>
              </g>
            ))}
            <Person
              x={1110 + 590 * r(t, 20, 160)}
              y={804}
              s={0.7}
              color={C.orange}
            />
            <T x={1100} y={850} size={25} fill={C.muted}>
              人员培训 · 旅客演练 · 应急流程
            </T>
          </>
        ) : (
          <>
            <Airport
              sid="S08-SH25"
              u={u}
              night
              x={20}
              y={180}
              w={1280}
              h={620}
              fit={1.15}
            />
            <g transform={`translate(${p[0]} ${p[1]}) rotate(${angle})`}>
              <path
                d="M-32 -3h21L-1 -31h7L3 -4l30 1q9 3 0 6L3 4l3 27h-7L-11 3h-21l-5 11h-5l4-14-4-14h5Z"
                fill={C.white}
                stroke={C.cyan}
                strokeWidth={1.5}
              />
            </g>
            <g opacity={r(t, 15, 45)}>
              <T x={1320} y={365} size={40} fill={C.cyan}>
                新建机场正式投运
              </T>
              <T x={1320} y={425} size={24} fill={C.muted}>
                Airport Opening
              </T>
            </g>
            <T x={960} y={765} size={64} anchor="middle" weight={700}>
              从建设愿景到正式起航
            </T>
            <T x={960} y={823} size={30} fill={C.cyan} anchor="middle">
              FROM VISION TO TAKEOFF
            </T>
          </>
        )}
      </Canvas>
    </Shot>
  );
};
