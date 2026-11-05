import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, r } from "./ui";
import captions from "./config/captions.json";
import shots from "./config/shots.json";
import audio from "./config/audio.json";
import s1 from "./config/scene01.json";
import s2 from "./config/scene02.json";
import s3 from "./config/scene03.json";
import s4 from "./config/scene04.json";
import s5 from "./config/scene05.json";
import s6 from "./config/scene06.json";
import s7 from "./config/scene07.json";
import s8 from "./config/scene08.json";
import { Scene01 } from "./scenes/Scene01";
import { Scene02 } from "./scenes/Scene02";
import { Scene03 } from "./scenes/Scene03";
import { Scene04 } from "./scenes/Scene04";
import { Scene05 } from "./scenes/Scene05";
import { Scene06 } from "./scenes/Scene06";
import { Scene07 } from "./scenes/Scene07";
import { Scene08 } from "./scenes/Scene08";
export const configs = [s1, s2, s3, s4, s5, s6, s7, s8];
const components = [
  Scene01,
  Scene02,
  Scene03,
  Scene04,
  Scene05,
  Scene06,
  Scene07,
  Scene08,
];
export const Film = () => {
  const f = useCurrentFrame(),
    sec = f / 30;
  const shot = shots.find((s) => sec >= s.start_s && sec < s.end_s)!;
  const cfg = configs.find(
    (s) => sec >= s.start && sec < s.start + s.duration,
  )!;
  const caption = captions.find((c) => sec >= c.start && sec < c.end);
  const title = f < 180 ? "一座国际机场是如何建成的？" : cfg.title;
  return (
    <AbsoluteFill
      data-film-frame={f}
      style={{
        background: C.navy,
        color: C.white,
        fontFamily: "AirportSans,sans-serif",
      }}
    >
      <style>{`@font-face{font-family:AirportSans;src:url('${staticFile("fonts/NotoSansCJK-Regular.ttc")}');font-weight:100 900;}*{box-sizing:border-box}`}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px,#24435a 1px,transparent 0)",
          backgroundSize: "48px 48px",
          opacity: 0.18,
        }}
      />
      {configs.map((s, i) => {
        const Comp = components[i];
        return (
          <Sequence
            key={s.id}
            from={s.start * 30}
            durationInFrames={s.duration * 30}
          >
            <Comp />
          </Sequence>
        );
      })}
      <div
        data-header
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: 190,
          background: `linear-gradient(${C.navy} 65%,#081d2d00)`,
          padding: "29px 80px 0",
        }}
      >
        <div style={{ fontSize: 18, letterSpacing: 4, color: C.cyan }}>
          AIRPORT / ENGINEERING IN MOTION
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 54, fontWeight: 700 }}>{title}</span>
          {f >= 180 && (
            <span style={{ fontSize: 26, color: C.cyan }}>{shot.title}</span>
          )}
        </div>
        <div style={{ fontSize: 21, color: C.muted, marginTop: 5 }}>
          {f < 180 ? "How Is an International Airport Built?" : cfg.eyebrow}
        </div>
      </div>
      {caption && (
        <div
          data-subtitle
          style={{
            position: "absolute",
            left: 130,
            right: 130,
            bottom: 100,
            minHeight: 92,
            borderRadius: 15,
            background: "#051826ef",
            padding: "13px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            lineHeight: 1.35,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {caption.text.match(/.{1,34}/gu)?.join("\n")}
        </div>
      )}
      {audio.enabled && audio.alignmentVerified && (
        <Audio src={staticFile(audio.file)} />
      )}
    </AbsoluteFill>
  );
};
