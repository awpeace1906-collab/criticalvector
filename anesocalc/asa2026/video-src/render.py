#!/usr/bin/env python3
"""Render the AnesCalc demo video from timeline.html.

    pip install playwright imageio-ffmpeg
    python3 render.py                 # full render → ../media/anescalc_demo.mp4 (+ _720p, poster)
    python3 render.py --stills 3 40   # write PNG previews at t=3s and t=40s to ./stills/

Frames are captured with a transparent background; during the app scene the phone
screen is a hole in the white canvas, and the clips/ recordings are composited
underneath it with ffmpeg.
"""
import argparse, os, shutil, subprocess, sys, pathlib
from playwright.sync_api import sync_playwright
import imageio_ffmpeg

HERE = pathlib.Path(__file__).resolve().parent
MEDIA = HERE.parent / "media"
FPS = 30
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
CHROMIUM = next((str(p) for p in pathlib.Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome")), None)


def open_page(p):
    browser = p.chromium.launch(executable_path=CHROMIUM) if CHROMIUM else p.chromium.launch()
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto((HERE / "timeline.html").as_uri())
    page.evaluate("document.fonts.ready")
    return browser, page


def stills(times):
    out = HERE / "stills"; out.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser, page = open_page(p)
        for t in times:
            page.evaluate(f"render({t})")
            page.screenshot(path=str(out / f"t{float(t):06.2f}.png"))
        browser.close()


def timeline():
    with sync_playwright() as p:
        browser, page = open_page(p)
        tl = page.evaluate("window.TIMELINE")
        browser.close()
    return tl


def capture(frames, tl):
    shutil.rmtree(frames, ignore_errors=True); frames.mkdir(parents=True)
    n = int(round(tl["TOTAL"] * FPS))
    with sync_playwright() as p:
        browser, page = open_page(p)
        for i in range(n):
            page.evaluate(f"render({i / FPS})")
            page.screenshot(path=str(frames / f"{i:05d}.png"), omit_background=True)
            if i % 150 == 0:
                print(f"frame {i}/{n}", flush=True)
        browser.close()


def compose(frames, tl):
    n = int(round(tl["TOTAL"] * FPS))
    s, app = tl["SCREEN"], tl["appStart"]
    clips = [str(HERE / "clips" / c["file"]) for c in tl["CLIPS"]]
    inputs = ["-framerate", str(FPS), "-i", str(frames / "%05d.png")]
    for c in clips:
        inputs += ["-i", c]
    k = len(clips)
    # The clip track is padded with exactly round(app*FPS) leading frames (rather than
    # shifted with setpts) so it stays frame-locked to the captured overlay frames.
    lead = int(round(app * FPS))
    tail = n - lead - sum(int(round(c["dur"] * FPS)) for c in tl["CLIPS"])  # hold the last clip frame to the end
    graph = (
        "".join(f"[{i + 1}:v]" for i in range(k)) + f"concat=n={k}:v=1,"
        f"fps={FPS},setpts=N/({FPS}*TB),tpad=start={lead}:stop={max(tail, 0)}:stop_mode=clone:color=white[cl];"
        f"color=white:s=1920x1080:r={FPS}:d={n / FPS}[bg];"
        f"[bg][cl]overlay={s['x']}:{s['y']}[b];"
        "[b][0:v]overlay=0:0:format=auto,format=yuv420p[out]"
    )
    MEDIA.mkdir(exist_ok=True)
    master = MEDIA / "anescalc_demo.mp4"
    subprocess.run([FFMPEG, "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[out]",
                    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", str(master)], check=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(master), "-vf", "scale=1280:720:flags=lanczos",
                    "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-movflags", "+faststart",
                    str(MEDIA / "anescalc_demo_720p.mp4")], check=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-ss", "0.5", "-i", str(master), "-frames:v", "1",
                    "-vf", "scale=1280:720", str(MEDIA / "anescalc_demo_poster.jpg")], check=True)
    print("wrote", master)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", nargs="+", type=float)
    ap.add_argument("--workdir", default="/tmp/anescalc-frames")
    ap.add_argument("--compose-only", action="store_true", help="reuse frames already in --workdir")
    a = ap.parse_args()
    if a.stills:
        stills(a.stills)
    else:
        tl, frames = timeline(), pathlib.Path(a.workdir)
        if not a.compose_only:
            capture(frames, tl)
        compose(frames, tl)
