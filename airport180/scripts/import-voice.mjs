import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const [wav, srt, confirmation] = process.argv.slice(2);
if (!wav || !srt || confirmation !== "--confirm-aligned")
  throw Error(
    "用法：node scripts/import-voice.mjs narration.wav aligned.srt --confirm-aligned。仅在已按真实语音对齐并人工确认后使用。",
  );
const meta = JSON.parse(
  execFileSync(
    "ffprobe",
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", wav],
    { encoding: "utf8" },
  ),
);
const duration = Number(meta.format.duration);
if (
  !meta.streams.some((s) => s.codec_type === "audio") ||
  !Number.isFinite(duration) ||
  duration <= 0 ||
  duration > 180
)
  throw Error(
    "音频必须有有效音轨且不超过180秒。请先按真实语音调整镜头与字幕，不能自动裁切旁白或强制加速。",
  );
const seconds = (s) => {
  const [h, m, x] = s.replace(",", ".").split(":").map(Number);
  return h * 3600 + m * 60 + x;
};
const blocks = fs
    .readFileSync(srt, "utf8")
    .trim()
    .split(/\r?\n\s*\r?\n/),
  caps = [];
let last = 0;
for (const b of blocks) {
  const lines = b.split(/\r?\n/),
    i = lines.findIndex((x) => x.includes("-->"));
  if (i < 0) throw Error("无效SRT时间行");
  const [a, z] = lines[i].split(/\s*-->\s*/).map(seconds),
    text = lines.slice(i + 1).join("");
  if (a < last || z <= a || z > duration + 0.15)
    throw Error("字幕时间应有序，且落在实际音频范围内");
  caps.push({ start: a, end: z, text });
  last = z;
}
const shots = JSON.parse(fs.readFileSync("src/config/shots.json"));
const normalize = (s) => s.replace(/[\p{P}\p{Z}\s]/gu, "");
if (
  normalize(caps.map((c) => c.text).join("")) !==
  normalize(shots.map((s) => s.voiceover_zh).join(""))
)
  throw Error("对齐字幕必须包含完整旁白，不能使用摘要替代语音转录。");
fs.mkdirSync("public/audio", { recursive: true });
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-i",
  wav,
  "-ar",
  "48000",
  "-ac",
  "2",
  "-c:a",
  "pcm_s16le",
  "-y",
  "public/audio/narration.wav",
]);
fs.writeFileSync("src/config/captions.json", JSON.stringify(caps, null, 2));
fs.copyFileSync(srt, "subtitles.zh-CN.aligned.srt");
fs.writeFileSync(
  "src/config/audio.json",
  JSON.stringify(
    {
      enabled: true,
      alignmentVerified: true,
      file: "audio/narration.wav",
      measuredDuration: duration,
      alignmentBasis:
        "operator-provided forced alignment and human confirmation; no rate conversion",
    },
    null,
    2,
  ),
);
console.log(
  "Imported measured audio and confirmed alignment. Recheck visual timing before rendering.",
);
