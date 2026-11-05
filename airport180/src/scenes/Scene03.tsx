import React from "react";
import {
  Canvas,
  C,
  T,
  Card,
  Doc,
  Flow,
  Shot,
  useShot,
  r,
  pop,
  Callout,
} from "../ui";
import { Airport } from "../airport";
import cfg from "../config/scene03.json";
export const Scene03 = () => {
  const { k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <Shot f={t}>
      <Canvas>
        {k === 0 ? (
          <>
            <T x={110} y={280} size={28} fill={C.muted}>
              初步总投资 / Initial Estimate
            </T>
            <T x={110} y={390} size={100} fill={C.cyan} weight={700}>
              {(20 * r(t, 0, 100)).toFixed(1)}
              <tspan fontSize={36}> 亿美元</tspan>
            </T>
            <T x={115} y={438} size={24} fill={C.muted}>
              USD 2.0 billion
            </T>
            <Airport x={10} y={425} w={900} h={420} fit={1.15} />
            {cfg.cost_labels.map((v, i) => (
              <g key={v} opacity={pop(t, 10 + i * 12)}>
                <T x={1000} y={278 + i * 66} size={25}>
                  {v}
                </T>
                <rect
                  x={1240}
                  y={253 + i * 66}
                  width={cfg.costs[i] * 72 * r(t, 20 + i * 12, 80 + i * 12)}
                  height={30}
                  rx={5}
                  fill={i === 7 ? C.orange : C.cyan}
                />
                <T x={1680} y={278 + i * 66} size={24} fill={C.muted}>
                  {cfg.costs[i].toFixed(1)} 亿
                </T>
              </g>
            ))}
          </>
        ) : k === 1 ? (
          <>
            <g transform={`translate(${Math.min(240, t * 2)} 0)`}>
              <Doc
                x={120}
                y={330}
                w={360}
                label="初步投资估算"
                en="Cost Estimate"
                stamp={t > 95 ? "审议" : ""}
              />
            </g>
            <Card
              x={1010}
              y={350}
              w={620}
              h={150}
              cn="机场业主 Employer"
              en="投资决策与融资安排"
              active
            />
            <Flow
              items={cfg.content.finance_flow}
              f={t}
              x={280}
              y={650}
              w={380}
              gap={100}
              step={35}
            />
            <Callout cn="估算是决策依据，随范围与市场信息逐步更新。" y={810} />
          </>
        ) : (
          <>
            {cfg.content.price_stages.map((v, i) => (
              <g key={v} opacity={pop(t, i * 25)}>
                <Card
                  x={180 + i * 570}
                  y={360}
                  w={450}
                  h={200}
                  cn={v.split("|")[0]}
                  en={v.split("|")[1]}
                  active={t > i * 25 + 20}
                  color={i === 0 ? C.cyan : C.orange}
                />
                {i < 2 && (
                  <T
                    x={690 + i * 570}
                    y={480}
                    size={75}
                    fill={C.orange}
                    anchor="middle"
                  >
                    ≠
                  </T>
                )}
              </g>
            ))}
            <Callout
              cn="工程范围、竞争报价与风险分配，共同影响合同价格。"
              en="Initial Cost Estimate ≠ Final Contract Price"
              y={710}
            />
          </>
        )}
      </Canvas>
    </Shot>
  );
};
