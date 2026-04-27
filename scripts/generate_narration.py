#!/usr/bin/env python3
"""Generate a narration MP3 from the checked-in narration text.

Prefers Edge TTS for higher quality narration. Falls back to local
`espeak` + `ffmpeg` when Edge TTS is unavailable.
"""

from __future__ import annotations

import argparse
import asyncio
import shutil
import subprocess
from pathlib import Path

DEFAULT_TEXT_FILE = Path("assets/narration.txt")
DEFAULT_OUTPUT_FILE = Path("assets/demo-narration.mp3")
DEFAULT_VOICE = "en-GB-SoniaNeural"
DEFAULT_ESPEAK_VOICE = "en-gb"


async def generate_edge_tts(text: str, output_file: Path, voice: str, rate: str) -> None:
    import edge_tts

    output_file.parent.mkdir(parents=True, exist_ok=True)
    communicator = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicator.save(str(output_file))


def generate_espeak(text: str, output_file: Path, voice: str, speed_wpm: int) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    wav_path = output_file.with_suffix(".wav")

    if shutil.which("espeak") is None:
        raise RuntimeError("espeak is not installed, and edge-tts could not be used.")
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required for espeak fallback MP3 generation.")

    subprocess.run([
        "espeak", "-v", voice, "-s", str(speed_wpm), "-w", str(wav_path), text
    ], check=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-q:a", "2", str(output_file)
    ], check=True)
    wav_path.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate demo narration MP3")
    parser.add_argument("--text-file", type=Path, default=DEFAULT_TEXT_FILE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_FILE)
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--rate", default="-2%", help="Speech rate for Edge TTS, e.g. -5%% or +0%%")
    parser.add_argument("--fallback-voice", default=DEFAULT_ESPEAK_VOICE)
    parser.add_argument("--fallback-speed", type=int, default=145)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    text = args.text_file.read_text(encoding="utf-8").strip()
    if not text:
        raise SystemExit(f"Narration text file is empty: {args.text_file}")

    try:
        asyncio.run(generate_edge_tts(text, args.output, args.voice, args.rate))
        print(f"Generated {args.output} using Edge TTS voice {args.voice}")
        return
    except Exception as exc:
        print(f"Edge TTS unavailable, falling back to eSpeak: {exc}")

    generate_espeak(text, args.output, args.fallback_voice, args.fallback_speed)
    print(f"Generated {args.output} using eSpeak voice {args.fallback_voice}")


if __name__ == "__main__":
    main()
