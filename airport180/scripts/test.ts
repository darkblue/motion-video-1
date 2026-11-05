import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { configs } from "../src/Film";
import shots from "../src/config/shots.json";
import captions from "../src/config/captions.json";
import costs from "../src/config/scene03.json";
import { facilities, projector, dimensions } from "../src/airport";
import baseline from "../src/data/airport-project.json";
import contracts from "../src/data/contracts.json";
let end = 0;
for (const s of shots) {
  assert.equal(s.start_s, end);
  assert.equal(s.frames_30fps[0], s.start_s * 30);
  assert.equal(s.frames_30fps[1], s.end_s * 30);
  assert.ok(s.voiceover_zh);
  end = s.end_s;
}
assert.equal(end, 180);
assert.equal(shots.length, 25);
end = 0;
for (const c of configs) {
  assert.equal(c.start, end);
  end += c.duration;
  assert.ok(c.shots.length);
  assert.ok(fs.existsSync(`src/scenes/Scene0${c.id}.tsx`));
}
assert.equal(end, 180);
let last = 0;
for (const c of captions) {
  assert.ok(c.start >= last && c.end > c.start && c.end <= 180);
  last = c.end;
}
assert.equal(
  costs.costs.reduce((a, b) => a + b, 0),
  20,
);
assert.equal(facilities.length, 13);
assert.equal(baseline.objects.length, 14);
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
assert.equal(
  hash(fs.readFileSync("src/data/airport-project.json", "utf8")),
  hash(fs.readFileSync("input/airport-project.json", "utf8")),
);
const owner = contracts.edges.filter((e) => e.type === "contract");
assert.deepEqual(
  owner.map((e) => [e.from, e.to]).sort(),
  [
    ["owner", "contractor"],
    ["owner", "designer"],
    ["owner", "engineer"],
  ].sort(),
);
assert.ok(
  !contracts.edges.some(
    (e) =>
      e.type === "contract" && e.from === "engineer" && e.to === "contractor",
  ),
);
const stable = JSON.stringify(baseline.objects);
for (const sid of ["S02-SH06", "S05-SH14", "S07-SH21", "S07-SH22", "S08-SH25"])
  for (let f = 0; f < 240; f++) {
    const p = projector(
      sid,
      f / 239,
      { x: 80, y: 200, w: 1300, h: 620 },
      sid === "S05-SH14" ? 2 : 1.15,
    );
    for (const o of facilities) {
      const [x, y, w, h] = dimensions(o);
      assert.ok(p([x + w / 2, y + h / 2, 0]).every(Number.isFinite));
    }
  }
assert.equal(JSON.stringify(baseline.objects), stable);
const runway = baseline.objects.find((o) => o.id === "runway")!.geometry as {
  x: number;
  y: number;
  width: number;
  height: number;
};
for (let f = 0; f < 120; f++) {
  const x = 1200 + 2800 * Math.min(1, Math.max(0, (f - 10) / 100));
  assert.ok(x >= runway.x && x <= runway.x + runway.width);
  assert.ok(1017.5 >= runway.y && 1017.5 <= runway.y + runway.height);
}
for (const [name, frames] of [
  ["planning", 270],
  ["bim", 540],
  ["reset", 150],
] as const) {
  const data = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_streams",
        "-of",
        "json",
        `public/blender/${name}.mp4`,
      ],
      { encoding: "utf8" },
    ),
  );
  assert.equal(Number(data.streams[0].nb_frames), frames);
}
for (const s of shots.slice(1))
  assert.ok(!/虚构|新岚|澜屿/.test(s.voiceover_zh));
const film = fs.readFileSync("src/Film.tsx", "utf8");
assert.ok(!/无配音版|无配音测试|bottom: 14|5399/.test(film));
assert.ok(fs.existsSync("public/fonts/NotoSansCJK-Regular.ttc"));
for (const s of fs.readdirSync("scripts").filter((s) => s.endsWith(".mjs")))
  execFileSync(process.execPath, ["--check", `scripts/${s}`]);
const report = {
  status: "PASS",
  scenes: 8,
  shots: 25,
  frames: 5400,
  source_geometry_sha256: hash(
    fs.readFileSync("src/data/airport-project.json", "utf8"),
  ),
  checks: [
    "timeline coverage",
    "subtitle order",
    "USD2bn reconciliation",
    "14 unmodified geometry objects",
    "finite camera projection over 1200 samples",
    "owner contracts and engineer file flow",
    "Blender clips frame counts",
    "straight illustrative takeoff centerline inside JSON runway",
    "fiction statement limited to first shot",
    "no footer/timecode/global progress JSX",
  ],
  real_airport_safety_validation: false,
};
fs.writeFileSync("reports/source-checks.json", JSON.stringify(report, null, 2));
console.log(report);
