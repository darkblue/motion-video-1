import cfg from "../config/scene06.json";
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
import { Equipment } from "../equipment";
export const Scene06 = () => {
  const { k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <Shot f={t}>
      <Canvas>
        {k === 0 ? (
          <>
            <Equipment f={t} />
            {cfg.content.submittals.map((v, i) => (
              <g key={v} opacity={pop(t, 30 + i * 18)}>
                <Doc
                  x={120 + i * 340}
                  y={620}
                  w={280}
                  label={v.split("|")[0]}
                  en={v.split("|")[1]}
                />
              </g>
            ))}
          </>
        ) : k === 1 ? (
          <>
            <Flow
              items={cfg.content.review_flow}
              f={t}
              x={180}
              y={290}
              w={400}
              gap={160}
              step={20}
            />
            <Line a={[1500, 405]} b={[1500, 570]} f={t} delay={60} file />
            <Card
              x={1280}
              y={580}
              w={450}
              h={125}
              cn="符合技术规范"
              en="Proceed within delegated authority"
              active={t > 90}
            />
            <g opacity={r(t, 60, 90)}>
              <path
                d="M1440 415V485H940V415"
                stroke={C.orange}
                strokeWidth={4}
                strokeDasharray="12 9"
                fill="none"
              />
              <T x={1030} y={535} size={26} fill={C.orange}>
                不符合 → 退回修改
              </T>
            </g>
            <g opacity={pop(t, 95)}>
              <Card
                x={250}
                y={580}
                w={720}
                h={125}
                cn="业主确认：仅在合同要求或权限触发时"
                en="Conditional Employer Confirmation"
                color={C.orange}
              />
            </g>
            <Callout
              cn="工程师审查 ≠ 自动批准；业主确认 ≠ 免除技术合规。"
              y={785}
            />
          </>
        ) : (
          <>
            {[
              "合同要求|Contract",
              "技术规范|Specifications",
              "合格制造商名单|Approved Manufacturers",
              "审批权限|Delegated Authority",
            ].map((v, i) => (
              <g key={v} opacity={pop(t, i * 18)}>
                <Card
                  x={150 + i * 430}
                  y={270}
                  w={380}
                  h={130}
                  cn={v.split("|")[0]}
                  en={v.split("|")[1]}
                  active={t > i * 18 + 20}
                />
              </g>
            ))}
            <Flow
              items={cfg.content.procurement_flow}
              f={t}
              x={260}
              y={560}
              w={400}
              gap={100}
              step={25}
            />
            <Callout
              cn="品牌与制造商确认有合同和技术依据，不能任意指定。"
              y={765}
            />
          </>
        )}
      </Canvas>
    </Shot>
  );
};
