import project from "../config/project.json";
import cfg from "../config/scene02.json";
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
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
export const Scene02 = () => {
  const { k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <Shot f={t}>
      {k === 1 ? (
        <>
          <OffthreadVideo
            muted
            src={staticFile("blender/planning.mp4")}
            style={{ width: 1920, height: 1080 }}
          />
          <Canvas>
            <rect
              x={1490}
              y={230}
              width={350}
              height={550}
              rx={20}
              fill={C.panel}
            />
            <T x={1515} y={280} fill={C.cyan}>
              固定工程布局
            </T>
            {cfg.content.planning_facilities.map((s, i) => (
              <g key={s} opacity={t > [0, 36, 72, 112, 155, 202][i] ? 1 : 0.25}>
                <rect
                  x={1515}
                  y={315 + i * 64}
                  width={5}
                  height={34}
                  rx={2}
                  fill={C.cyan}
                />
                <T x={1535} y={341 + i * 64} size={24}>
                  {s}
                </T>
              </g>
            ))}
          </Canvas>
        </>
      ) : (
        <Canvas>
          {k === 0 ? (
            <>
              {[0, 1, 2].map((i) => (
                <g key={i} opacity={pop(t, i * 18)}>
                  <path
                    d={`M${170 + i * 350} 370l210-70 130 100-200 80Z`}
                    fill={i === 1 ? "#2d827e" : C.panel}
                    stroke={i === 1 ? C.cyan : C.line}
                    strokeWidth={3}
                  />
                  <T x={330 + i * 350} y={530} anchor="middle" size={24}>
                    候选场址 {String.fromCharCode(65 + i)}
                  </T>
                </g>
              ))}
              <T x={1280} y={340} fill={C.cyan} size={66}>
                {project.planning_target / 10000}万
              </T>
              <T x={1280} y={390} size={25}>
                年旅客规划目标
              </T>
              <path
                d="M1270 650h470M1270 650V450"
                stroke={C.line}
                strokeWidth={3}
              />
              <path
                d="M1290 625Q1450 610 1700 475"
                fill="none"
                stroke={C.cyan}
                strokeWidth={6}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - r(t, 30, 140)}
              />
              <Flow
                items={[
                  "需求预测|Demand Forecast",
                  "选址与空域|Site / Airspace",
                  "环境与交通|Environment / Access",
                ]}
                f={t}
                x={250}
                y={700}
                w={400}
                gap={110}
              />
            </>
          ) : (
            <>
              <Airport
                sid="S02-SH06"
                u={t / 269}
                x={50}
                y={200}
                w={1120}
                h={620}
                fit={1.15}
              />
              <T x={1190} y={300} size={48} fill={C.cyan}>
                从方案到设计依据
              </T>
              <T x={1190} y={354} size={23} fill={C.muted}>
                咨询与设计成果逐步深化
              </T>
              {cfg.content.deliverables.map((v, i) => (
                <g key={v} opacity={pop(t, i * 37)}>
                  <Card
                    x={1200}
                    y={400 + i * 105}
                    w={590}
                    h={90}
                    cn={v.split("|")[0]}
                    en={v.split("|")[1]}
                    active={t > i * 37 + 20}
                  />
                </g>
              ))}
              <T x={150} y={790} size={23} fill={C.muted}>
                货运区 Cargo · 交通中心 GTC：纳入总体规划
              </T>
              <T x={150} y={833} size={23} fill={C.cyan}>
                空侧 Airside → 航站楼 → 陆侧 Landside
              </T>
            </>
          )}
        </Canvas>
      )}
    </Shot>
  );
};
