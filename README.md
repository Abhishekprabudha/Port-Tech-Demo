# AIonOS Port Twin Agent Demo

A static, client-shareable HTML repo for the supplied **AIonOS Port Twin Agent** video. The demo plays the uploaded port-twin WebM inline, syncs it with a pre-generated narration MP3, and includes a rendered narrated MP4 export clipped for clean playback.

## Files

- `index.html` — main browser demo page
- `styles.css` — visual styling for the AIonOS port-twin experience
- `script.js` — playback logic, narration sync, cue captions, and two-round stop behaviour
- `assets/port-twin-agent-demo.webm` — original uploaded demo video
- `assets/narration.txt` — single-source narration script
- `assets/demo-narration.mp3` — generated narration audio
- `assets/port-twin-agent-demo-narrated.mp4` — narrated MP4 export
- `scripts/generate_narration.py` — narration generator script; prefers Edge TTS, falls back to local eSpeak
- `.github/workflows/generate-narration.yml` — regenerates and commits narration MP3
- `.github/workflows/render-narrated-mp4.yml` — renders/muxes narrated MP4 from the video and MP3

## Demo storyline

The narration explains how the AIonOS Port Twin Agent calculates berth position and crane assignment by combining:

- vessel dimensions, berth window, quay limits, draft and clearance constraints
- berth positioning logic to reduce crane travel, truck congestion, and vessel turnaround risk
- crane reach, bay coverage, working radius, separation distance, and interference checks
- dynamic recalculation when berth timing, crane availability, or bay sequencing changes
- supervisor-facing recommendations with operational impact and expected throughput gain

## How to use

1. Upload the full folder to GitHub Pages, Netlify, Vercel, or any static web server.
2. Open `index.html` through the hosted URL.
3. Click **Play demo with narration** once.
4. The video plays inline and stops cleanly after two rounds.

## Regenerate narration MP3

Edit `assets/narration.txt`, then run:

```bash
pip install edge-tts
python scripts/generate_narration.py
```

If Edge TTS is unavailable locally, the script falls back to `espeak` + `ffmpeg` when those tools are installed.

## Render narrated MP4

Run locally:

```bash
SOURCE_DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 assets/port-twin-agent-demo.webm)
TRIMMED_DURATION=$(python -c 'import sys; s=float(sys.argv[1]); print(max(s-1.0, s*0.9))' "$SOURCE_DURATION")

ffmpeg -y -i assets/port-twin-agent-demo.webm -i assets/demo-narration.mp3 \
  -filter_complex "[0:v]crop=iw:ih-54:0:54,trim=duration=${TRIMMED_DURATION},setpts=PTS-STARTPTS[vtrim];[vtrim][vtrim]concat=n=2:v=1:a=0[vout]" \
  -map "[vout]" -map 1:a:0 \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -b:a 160k \
  -shortest -movflags +faststart \
  assets/port-twin-agent-demo-narrated.mp4
```

Or trigger the GitHub Actions workflow **Render narrated MP4**.

## Browser note

Most browsers block autoplay with audio until the viewer interacts once. The demo therefore shows a start overlay and starts playback after the user clicks the button.
