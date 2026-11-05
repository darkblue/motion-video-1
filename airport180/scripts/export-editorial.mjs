import fs from "node:fs";
const scenes = Array.from({ length: 8 }, (_, i) =>
  JSON.parse(fs.readFileSync(`src/config/scene0${i + 1}.json`)),
);
const shots = scenes.flatMap((s) => s.shots),
  captions = [];
for (const s of shots) {
  const parts = s.voiceover_zh.match(/[^。！？；]+[。！？；]?/gu) || [];
  let start = s.start_s + 0.25;
  const total = s.end_s - start - 0.22 - 0.1 * (parts.length - 1),
    weight = parts.reduce((a, b) => a + b.length, 0);
  for (const text of parts) {
    const end = start + (total * text.length) / weight;
    captions.push({
      shot_id: s.shot_id,
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3)),
      text,
    });
    start = end + 0.1;
  }
}
fs.writeFileSync("src/config/shots.json", JSON.stringify(shots, null, 2));
fs.writeFileSync("src/config/captions.json", JSON.stringify(captions, null, 2));
const tc = (t) => {
  const n = Math.round(t * 1000);
  return `${String(Math.floor(n / 3600000)).padStart(2, "0")}:${String(Math.floor(n / 60000) % 60).padStart(2, "0")}:${String(Math.floor(n / 1000) % 60).padStart(2, "0")},${String(n % 1000).padStart(3, "0")}`;
};
fs.writeFileSync(
  "subtitles.zh-CN.editorial.srt",
  captions
    .map(
      (s, i) =>
        `${i + 1}\n${tc(s.start)} --> ${tc(s.end)}\n${s.text.match(/.{1,34}/gu).join("\n")}`,
    )
    .join("\n\n") + "\n",
);
fs.writeFileSync(
  "narration.zh-CN.md",
  "# 一座国际机场是如何建成的？\n\n字幕为编辑安排，未作真实语音对齐。请优先编辑各场景JSON中的voiceover_zh后重新导出。\n\n" +
    shots
      .map(
        (s) =>
          `## ${s.shot_id} · ${s.start_s}–${s.end_s}秒 · ${s.title}\n\n${s.voiceover_zh}`,
      )
      .join("\n\n") +
    "\n",
);
console.log(
  "25-shot narration and editorial captions exported. No speech alignment claimed.",
);
