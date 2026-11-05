import cfg from "../config/scene05.json";
import React from "react";
import { Sequence, OffthreadVideo, Freeze, staticFile } from "remotion";
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
  ease,
  Callout,
} from "../ui";
import { Airport } from "../airport";
const LayerPanel = ({ t, clash = false }: { t: number; clash?: boolean }) => (
  <Canvas>
    <rect x={1490} y={240} width={350} height={570} rx={20} fill={C.panel} />
    <T x={1515} y={292} size={26} fill={C.cyan}>
      {clash ? "碰撞 → 局部协调" : "BIM多专业协同"}
    </T>
    {clash ? (
      <>
        <T x={1515} y={365} size={24}>
          青色：固定风管
        </T>
        <T x={1515} y={415} size={24} fill={C.orange}>
          橙色：局部桥架
        </T>
        <T x={1515} y={485} size={24}>
          端点位置保持不变
        </T>
        <T
          x={1515}
          y={575}
          size={32}
          fill={ease((t - 60) / 90) >= 0.301 ? C.cyan : C.orange}
        >
          {ease((t - 60) / 90) >= 0.301 ? "✓ 冲突已消除" : "! 检测到冲突"}
        </T>
        <T x={1515} y={665} size={23} fill={C.muted}>
          调整路径后重新检查
        </T>
      </>
    ) : (
      <>
        {cfg.content.bim_layers.map((s, i) => (
          <g key={s} opacity={t > i * 42 ? 1 : 0.3}>
            <rect
              x={1515}
              y={328 + i * 68}
              width={5}
              height={33}
              fill={[C.muted, C.cyan, C.cyan, C.orange, C.purple][i]}
            />
            <T x={1535} y={355 + i * 68} size={24}>
              {s}
            </T>
          </g>
        ))}
        <T x={1515} y={750} size={22} fill={C.muted}>
          协调模型 · 非施工图
        </T>
      </>
    )}
  </Canvas>
);
export const Scene05 = () => {
  const { f, k, t } = useShot(cfg.shots.map((s) => s.start_s - cfg.start));
  return (
    <>
      {k === 0 && (
        <Shot f={t}>
          <Canvas>
            <Airport
              sid="S05-SH14"
              u={t / 209}
              x={60}
              y={200}
              w={1300}
              h={620}
              fit={2}
            />
            <Card
              x={1330}
              y={280}
              w={480}
              h={130}
              cn="业主设计方"
              en="主体设计 / Employer-designed works"
              active
            />
            <Card
              x={1330}
              y={465}
              w={480}
              h={130}
              cn="施工总承包商"
              en="施工详图及合同约定的设计部分"
            />
            <Callout
              x={170}
              y={760}
              w={1550}
              cn="详细设计 Detailed Design · 施工详图 Shop Drawings"
              en="设计责任按合同划分；RFI = Request for Information（信息请求）。"
            />
          </Canvas>
        </Shot>
      )}
      <Sequence from={210} durationInFrames={540}>
        <OffthreadVideo
          muted
          src={staticFile("blender/bim.mp4")}
          style={{ width: 1920, height: 1080 }}
        />
        {k === 2 && t < 18 && (
          <Freeze frame={299}>
            <OffthreadVideo
              muted
              src={staticFile("blender/bim.mp4")}
              style={{
                position: "absolute",
                width: 1920,
                height: 1080,
                opacity: 1 - r(t, 0, 18),
              }}
            />
          </Freeze>
        )}
      </Sequence>
      {k === 1 && <LayerPanel t={t} />}
      {k === 2 && <LayerPanel t={t} clash />}
      <Sequence from={750} durationInFrames={150}>
        <OffthreadVideo
          muted
          src={staticFile("blender/reset.mp4")}
          style={{ width: 1920, height: 1080 }}
        />
      </Sequence>
      {k === 3 && (
        <Canvas>
          <rect
            x={1490}
            y={245}
            width={350}
            height={360}
            rx={20}
            fill={C.panel}
          />
          <T x={1515} y={302} size={27} fill={C.cyan}>
            模型复位 / Reassembly
          </T>
          <T x={1515} y={365} size={24}>
            分层回归基准位置
          </T>
          <T x={1515} y={415} size={24}>
            保留已协调桥架路径
          </T>
          <T x={1515} y={493} size={30} fill={C.cyan}>
            {t >= 149 ? "✓ 复位完成" : "多专业模型归位中"}
          </T>
          <Flow
            items={cfg.content.review_flow}
            f={t}
            x={110}
            y={735}
            w={350}
            gap={100}
            step={24}
          />
        </Canvas>
      )}
    </>
  );
};
