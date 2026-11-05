import cfg from "../config/scene04.json";
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
import { Contracts } from "../VerifiedTests";
export const Scene04 = () => {
  const { f, k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <Shot f={t}>
      {k >= 2 ? (
        <Contracts frame={f - 510} />
      ) : (
        <Canvas>
          {k === 0 ? (
            <>
              <Card
                x={140}
                y={260}
                w={1100}
                h={120}
                cn="传统模式：Design–Bid–Build"
                en="业主委托设计 → 施工招标 → 施工总承包"
                active
              />
              <Flow
                items={cfg.content.dbb_flow}
                f={t}
                x={150}
                y={465}
                w={280}
                gap={100}
              />
              <Card
                x={1320}
                y={260}
                w={480}
                h={120}
                cn="Design–Build / EPC"
                en="承包商统一承担更多设计与施工责任"
                color={C.orange}
              />
              <Doc
                x={1370}
                y={460}
                w={370}
                label="责任与风险分配"
                en="Defined by the Contract"
              />
              <Callout
                cn="FIDIC示例：红皮书 / 黄皮书 / 银皮书"
                en="常见对应：业主设计 / 设计建造 / EPC交钥匙；实际以合同版本、专用条件及采购规则为准。"
                y={750}
              />
            </>
          ) : (
            <>
              <Card
                x={730}
                y={230}
                w={450}
                cn="机场业主 Employer"
                en="组织国际工程采购"
                active
              />
              {cfg.content.tender_flow.map((v, i) => (
                <g key={v} opacity={pop(t, i * 25)}>
                  <Card
                    x={110 + i * 350}
                    y={470}
                    w={310}
                    h={125}
                    cn={v.split("|")[0]}
                    en={v.split("|")[1]}
                    active={t > i * 25 + 20}
                  />
                  {i < 4 && (
                    <path
                      d={`M${430 + i * 350} 532h28`}
                      stroke={C.cyan}
                      strokeWidth={4}
                    />
                  )}
                </g>
              ))}
              <g opacity={pop(t, 110)}>
                <Doc
                  x={300}
                  y={680}
                  w={300}
                  label="技术方案"
                  en="Technical Proposal"
                />
                <Doc
                  x={790}
                  y={680}
                  w={300}
                  label="商务报价"
                  en="Financial Proposal"
                />
                <Doc
                  x={1280}
                  y={680}
                  w={300}
                  label="履约能力"
                  en="Delivery Capability"
                />
              </g>
            </>
          )}
        </Canvas>
      )}
    </Shot>
  );
};
