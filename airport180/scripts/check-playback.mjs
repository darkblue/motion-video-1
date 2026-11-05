import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { openBrowser } from "@remotion/renderer";
const file = path.resolve(process.argv[2] || "renders/airport-180s-1080p.mp4");
const size = fs.statSync(file).size;
const server = http.createServer((req, res) => {
  if (req.url !== "/film.mp4") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      '<!doctype html><html><body><video id="v" muted controls src="/film.mp4"></video></body></html>',
    );
    return;
  }
  const match = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
  const start = match ? Number(match[1]) : 0,
    end = match && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  res.writeHead(match ? 206 : 200, {
    "Content-Type": "video/mp4",
    "Content-Length": end - start + 1,
    "Accept-Ranges": "bytes",
    ...(match ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
  });
  fs.createReadStream(file, { start, end }).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await openBrowser("chrome", {
    browserExecutable:
      process.env.CHROME_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  });
  const page = await browser.newPage({
    context: undefined,
    logLevel: "error",
    indent: false,
    pageIndex: 0,
    onBrowserLog: null,
    onLog: () => {},
  });
  await page.goto({
    url: `http://127.0.0.1:${server.address().port}`,
    timeout: 30000,
  });
  const result = await page.evaluate(async () => {
    const v = document.getElementById("v");
    const event = (name) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(Error("Video event timeout: " + name)),
          20000,
        );
        v.addEventListener(
          name,
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
        v.addEventListener(
          "error",
          () => {
            clearTimeout(timer);
            reject(Error("Video error " + v.error?.code));
          },
          { once: true },
        );
      });
    if (v.readyState < 2) await event("loadeddata");
    await v.play();
    await new Promise((r) => setTimeout(r, 600));
    const playedTo = v.currentTime,
      decodedFrames = v.getVideoPlaybackQuality().totalVideoFrames;
    v.pause();
    const seek = event("seeked");
    v.currentTime = 178;
    await seek;
    return {
      duration: v.duration,
      width: v.videoWidth,
      height: v.videoHeight,
      playedTo,
      decodedFrames,
      seekedTo: v.currentTime,
      readyState: v.readyState,
      error: v.error?.code ?? null,
      canPlayH264: v.canPlayType('video/mp4; codecs="avc1.640028"'),
    };
  });
  if (
    result.duration !== 180 ||
    result.width !== 1920 ||
    result.height !== 1080 ||
    result.playedTo <= 0 ||
    result.decodedFrames < 1 ||
    result.seekedTo < 177 ||
    result.error !== null
  )
    throw Error(JSON.stringify(result));
  fs.writeFileSync(
    "renders/playback-check.json",
    JSON.stringify(
      { checkedAt: new Date().toISOString(), browser: "Chromium", ...result },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS Chromium video load, play, decode and seek:",
    JSON.stringify(result),
  );
} finally {
  if (browser) await browser.close({ silent: true });
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
