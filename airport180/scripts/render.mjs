import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
const audioConfig = JSON.parse(
  fs.readFileSync("src/config/audio.json", "utf8"),
);
const dir = process.env.OUTPUT_DIR || "renders";
fs.mkdirSync(dir, { recursive: true });
const browserExecutable =
  process.env.CHROME_PATH ||
  (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const options = {
  serveUrl,
  browserExecutable,
  chromiumOptions: { disableWebSecurity: false },
};
const composition = await selectComposition({ ...options, id: "Airport180" });
if (process.argv.includes("--stills")) {
  const shots = JSON.parse(fs.readFileSync("src/config/shots.json", "utf8"));
  const frames = shots.map((s) => ({
    id: s.shot_id,
    frame: Math.floor((s.start_s + s.end_s) * 15),
  }));
  for (const { id, frame: f } of frames) {
    await renderStill({
      ...options,
      composition,
      frame: f,
      output: `${dir}/${id}.png`,
    });
    console.log(`Still ${id}`);
  }
} else {
  let prev = -1;
  let last = 0;
  await renderMedia({
    ...options,
    composition,
    codec: "h264",
    crf: 20,
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    muted: !audioConfig.enabled,
    enforceAudioTrack: false,
    outputLocation: `${dir}/airport-remotion-raw.mp4`,
    concurrency: Math.min(3, os.availableParallelism()),
    x264Preset: "fast",
    onProgress: ({ progress, renderedFrames }) => {
      const n = Math.floor(progress * 100);
      if ((n !== prev && n % 5 === 0) || Date.now() - last > 20000) {
        prev = n;
        last = Date.now();
        console.log(`Render ${n}% | frames ${renderedFrames}/5400`);
      }
    },
  });
  const args = [
    "-v",
    "error",
    "-i",
    `${dir}/airport-remotion-raw.mp4`,
    "-map",
    "0:v:0",
    ...(audioConfig.enabled
      ? ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "192k", "-af", "apad"]
      : ["-an"]),
    "-vf",
    "scale=in_range=auto:out_range=limited:out_color_matrix=bt709,format=yuv420p",
    "-c:v",
    "libx264",
    "-threads",
    String(Math.min(3, os.availableParallelism())),
    "-preset",
    "fast",
    "-crf",
    "18",
    "-color_range",
    "tv",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-r",
    "30",
    "-frames:v",
    "5400",
    "-t",
    "180",
    "-video_track_timescale",
    "30000",
    "-movflags",
    "+faststart",
    "-y",
    `${dir}/airport-180s-1080p.mp4`,
  ];
  execFileSync(process.env.FFMPEG_PATH || "ffmpeg", args, { stdio: "inherit" });
  console.log("MP4 complete (normalized, 180 seconds)");
}
