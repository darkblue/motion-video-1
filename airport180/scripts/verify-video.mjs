import fs from "node:fs";
import { execFileSync } from "node:child_process";
const file = process.argv[2] || "renders/airport-180s-1080p.mp4";
const data = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-count_frames",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  ),
);
const v = data.streams.find((x) => x.codec_type === "video");
function check(ok, msg) {
  if (!ok) throw Error(msg);
}
check(v, "Missing video stream");
const audioConfig = JSON.parse(
  fs.readFileSync("src/config/audio.json", "utf8"),
);
if (!audioConfig.enabled)
  check(
    data.streams.every((s) => s.codec_type !== "audio"),
    "Silent edition must contain no audio track",
  );
check(v.width === 1920 && v.height === 1080, "Resolution mismatch");
check(v.r_frame_rate === "30/1", "Frame rate mismatch");
check(Number(v.nb_read_frames) === 5400, "Frame count mismatch");
check(Math.abs(Number(data.format.duration) - 180) < 0.04, "Duration mismatch");
check(
  v.codec_name === "h264" && v.pix_fmt === "yuv420p",
  "Playback codec mismatch",
);
const sampleFrames = [
  30, 540, 630, 1275, 1380, 1890, 1980, 2760, 2880, 3660, 3780, 4290, 4380,
  5025, 5130, 5370,
];
const select = sampleFrames.map((n) => `eq(n\\,${n})`).join("+");
const md5 = execFileSync(
  "ffmpeg",
  [
    "-v",
    "error",
    "-xerror",
    "-i",
    file,
    "-vf",
    `crop=1760:650:80:210,select='${select}'`,
    "-fps_mode",
    "vfr",
    "-f",
    "framemd5",
    "-",
  ],
  { encoding: "utf8" },
);
const hashes = md5
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"))
  .map((l) => l.split(",").at(-1).trim());
check(hashes.length === 16, "Missing decoded scene samples");
for (let i = 0; i < 8; i++)
  check(
    hashes[i * 2] !== hashes[i * 2 + 1],
    `Scene ${i + 1} has no visible change in sampled action area`,
  );
fs.writeFileSync("renders/motion-samples.framemd5", md5);
const report = {
  file,
  verifiedAt: new Date().toISOString(),
  width: v.width,
  height: v.height,
  fps: v.r_frame_rate,
  frames: Number(v.nb_read_frames),
  duration: Number(data.format.duration),
  codec: v.codec_name,
  pixelFormat: v.pix_fmt,
  sizeBytes: Number(data.format.size),
  audioStreams: data.streams.filter((s) => s.codec_type === "audio").length,
  checks: [
    "metadata",
    "full-frame count",
    "complete ffmpeg decode without errors",
    "8 scene action-area sample pairs differ (header and subtitle excluded)",
  ],
  captionStatus:
    "Editorial timing only. No generated voice or actual-speech alignment.",
};
fs.writeFileSync(
  "renders/verification.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
