import cfg from "../config/scene07.json";
import React from "react";
import {
  Canvas,
  C,
  T,
  Card,
  Doc,
  Flow,
  Line,
  Shot,
  useShot,
  r,
  pop,
  Callout,
} from "../ui";
import { Airport } from "../airport";
import { Equipment } from "../equipment";
export const Scene07 = () => {
  const { k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <Shot f={t}>
      <Canvas>
        {k === 0 ? (
          <>
            <Airport
              sid="S07-SH21"
              u={t / 239}
              build={r(t, 0, 180)}
              x={20}
              y={200}
              w={1250}
              h={460}
              fit={1.15}
            />
            <g
              transform={`translate(${600 + 60 * Math.sin(t / 50)} 330)`}
              opacity={1 - r(t, 195, 239)}
            >
              <path
                d="M0 250V0H280M0 0L180 40H-70M230 0v120"
                stroke={C.orange}
                strokeWidth={7}
                fill="none"
              />
              <path d="M217 120h26v22h-26Z" fill={C.orange} />
            </g>
            <T x={1350} y={280} size={33} fill={C.cyan}>
              交叉推进 · 并行建设
            </T>
            {cfg.content.construction_steps.map((v, i) => (
              <g key={v} opacity={pop(t, i * 25)}>
                <T x={1350} y={360 + i * 75} size={28}>
                  {v}
                </T>
              </g>
            ))}
            {cfg.content.gantt_groups.map((v, i) => (
              <g key={v}>
                <T x={140} y={715 + i * 43} size={23} fill={C.muted}>
                  {v}
                </T>
                <rect
                  x={390}
                  y={696 + i * 43}
                  width={1350}
                  height={23}
                  rx={5}
                  fill={C.panel}
                />
                <rect
                  x={390 + i * 180}
                  y={696 + i * 43}
                  width={(1050 - i * 140) * r(t, i * 18, 100 + i * 18)}
                  height={23}
                  rx={5}
                  fill={i === 3 ? C.orange : C.cyan}
                />
              </g>
            ))}
          </>
        ) : k === 1 ? (
          <>
            <Airport
              sid="S07-SH22"
              u={t / 239}
              x={50}
              y={230}
              w={1120}
              h={570}
              fit={1.65}
            />
            {cfg.content.installation_steps.map((v, i) => (
              <g key={v} opacity={pop(t, i * 35)}>
                <Card
                  x={1210}
                  y={270 + i * 155}
                  w={580}
                  h={125}
                  cn={v.split("|")[0]}
                  en={v.split("|")[1]}
                  active={t > i * 35 + 20}
                />
              </g>
            ))}
            <T x={180} y={805} size={27} fill={C.cyan}>
              BHS / FIDS / Security / CUPPS
            </T>
            <T x={1210} y={805} size={25} fill={C.muted}>
              屋面围护完成 → 设备安装与保护
            </T>
          </>
        ) : (
          <>
            <Card
              x={730}
              y={235}
              w={460}
              h={120}
              cn="AODB · 机场运行数据库"
              en="Airport Operational Database"
              active
            />
            {[
              ["FIDS", "航班信息显示"],
              ["BHS / BRS", "行李处理与行李再确认"],
              ["DCS / CUPPS", "离港与共用旅客处理"],
              ["Security Systems", "安防系统"],
              ["Airport Network", "机场网络"],
            ].map(([en, cn], i) => {
              const x = 100 + i * 355;
              return (
                <g key={en}>
                  <Line
                    a={[960, 355]}
                    b={[x + 160, 520]}
                    f={t}
                    delay={i * 28}
                    file
                  />
                  <g opacity={pop(t, i * 28)}>
                    <Card
                      x={x}
                      y={530}
                      w={320}
                      h={130}
                      cn={en}
                      en={cn}
                      active={t > i * 28 + 30}
                    />
                  </g>
                </g>
              );
            })}
            <Flow
              items={cfg.content.test_flow}
              f={t - 90}
              x={270}
              y={745}
              w={400}
              gap={100}
              step={25}
            />
            <T x={960} y={705} anchor="middle" size={24} fill={C.muted}>
              数据、接口与业务流程共同验证；网络节点表示通信基础设施。
            </T>
          </>
        )}
      </Canvas>
    </Shot>
  );
};
