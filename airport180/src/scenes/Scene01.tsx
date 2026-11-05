import project from "../config/project.json";
import cfg from "../config/scene01.json";
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
  Callout,
} from "../ui";
export const Scene01 = () => {
  const { k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <Shot f={t}>
      <Canvas>
        {k === 0 ? (
          <>
            <T x={110} y={232} size={30} fill={C.orange}>
              虚构的发展中国家机场建设案例
            </T>
            {Array.from({ length: 15 }, (_, i) => (
              <g key={i} opacity={pop(t, i * 8)}>
                <rect
                  x={110 + i * 65}
                  y={550 - (i % 4) * 60}
                  width={43}
                  height={85 + (i % 4) * 60}
                  rx={3}
                  fill={i % 3 === 0 ? "#426e87" : "#234e68"}
                />
                <path
                  d={`M${120 + i * 65} ${565 - (i % 4) * 60}v25m12-25v25`}
                  stroke={C.cyan}
                  strokeWidth={5}
                />
              </g>
            ))}
            <rect
              x={120}
              y={680}
              width={900}
              height={70}
              rx={15}
              fill={C.panel}
            />
            <path
              d="M170 715h800"
              stroke={C.white}
              strokeWidth={3}
              strokeDasharray="23 17"
            />
            <T x={1190} y={330} size={24} fill={C.muted}>
              现有机场年容量
            </T>
            <T x={1180} y={445} size={112} fill={C.orange} weight={700}>
              {Math.round((project.existing_capacity / 10000) * r(t, 0, 80))}万
            </T>
            <T x={1190} y={492} size={24} fill={C.muted}>
              Passengers / year
            </T>
            <path
              d="M1170 740h580M1170 740V540"
              stroke={C.line}
              strokeWidth={3}
            />
            <path
              d="M1180 710Q1330 700 1410 650T1715 550"
              fill="none"
              stroke={C.cyan}
              strokeWidth={7}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - r(t, 30, 170)}
            />
            <T x={1270} y={798} fill={C.cyan}>
              航空需求持续增长
            </T>
          </>
        ) : k === 1 ? (
          <>
            <rect
              x={370}
              y={460}
              width={1170}
              height={200}
              rx={95}
              fill="#1e455c"
            />
            {["政府代表", "交通主管部门", "机场业主"].map((s, i) => (
              <g key={s} opacity={pop(t, i * 14)}>
                <Person x={550 + i * 410} y={390} />
                <T x={550 + i * 410} y={290} anchor="middle">
                  {s}
                </T>
              </g>
            ))}
            <g
              opacity={pop(t, 30)}
              transform={`translate(${250 * (1 - pop(t, 30))} 0)`}
            >
              <Doc
                x={720}
                y={435}
                w={470}
                label="机场建设议案"
                en="Airport Development Proposal"
              />
            </g>
            <T x={960} y={770} anchor="middle" size={50} fill={C.cyan}>
              新建机场目标：{project.planning_target / 10000}万人次 / 年
            </T>
          </>
        ) : (
          <>
            <Doc
              x={150}
              y={310}
              w={390}
              label="建设议案"
              en="Development Proposal"
              stamp={t > 45 ? "立项" : ""}
            />
            <Flow
              items={cfg.content.decision_flow}
              f={t}
              x={660}
              y={350}
              w={310}
              gap={65}
              step={30}
            />
            <Flow
              items={cfg.content.demand_flow}
              f={t}
              x={180}
              y={650}
              w={310}
              gap={90}
              step={22}
            />
            <Callout
              cn="项目启动 ≠ 开工许可"
              en="立项、投资决策、用地及施工许可，分别按适用程序办理。"
              color={C.orange}
            />
          </>
        )}
      </Canvas>
    </Shot>
  );
};
