#!/usr/bin/env python3
"""
Generate nonce word audio stimuli.
Uses edge-tts (Microsoft Neural TTS, free, no API key).

Install:
    pip install edge-tts pydub numpy

Run:
    python generate_stimuli.py

Output: stimuli/*.wav, all RMS-normalized to the same level.
Then open in Praat to verify segment durations and F0.
"""

import asyncio, os, sys, struct, math
import numpy as np
from pydub import AudioSegment
from pydub.effects import normalize

VOICE    = "en-US-AndrewNeural"   # neutral, clear male voice
OUT_DIR  = "public/stimuli"
RATE     = "-5%"                  # slightly slower for clarity

# All nonce words: CCVC (onset-heavy) and CVCC (coda-heavy)
WORDS = [
    # CCVC — 2 onset consonants, 1 coda consonant
    "brep", "blef", "freb", "flep", "greb", "glek",
    "krev", "klev", "trep", "plev",
    "drep", "dref", "slek", "slem", "plek",
    "preb", "gref", "glem", "blek", "frev",
    # CVCC — 1 onset consonant, 2 coda consonants
    "berp", "belf", "ferb", "felp", "gerb", "gelk",
    "kerv", "kelv", "terp", "pelv",
    "derp", "derf", "selk", "selm", "pelk",
    "perb", "gerf", "gelm", "belk", "ferv",
]


async def synthesize_one(word: str, out_mp3: str) -> None:
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts not found. Run: pip install edge-tts")
    communicate = edge_tts.Communicate(word, VOICE, rate=RATE)
    await communicate.save(out_mp3)


async def synthesize_all() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Synthesizing {len(WORDS)} words with voice '{VOICE}'...")
    tasks = [synthesize_one(w, os.path.join(OUT_DIR, f"{w}.mp3")) for w in WORDS]
    await asyncio.gather(*tasks)
    print("  Done.")


VOLUME_CHECK_TEXT = (
    "This is a sound check for the speech memory study. "
    "You will hear short nonsense words like brep, felk, and slem. "
    "Please adjust your volume now until this voice sounds clear and comfortable — "
    "not too quiet, not too loud. "
    "When you are ready, press continue."
)


async def build_volume_check() -> None:
    """TTS passage for volume calibration, same voice as stimuli."""
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts not found. Run: pip install edge-tts")
    mp3 = os.path.join(OUT_DIR, "volume_check.mp3")
    communicate = edge_tts.Communicate(VOLUME_CHECK_TEXT, VOICE, rate=RATE)
    await communicate.save(mp3)
    seg = AudioSegment.from_mp3(mp3)
    delta = -20.0 - seg.dBFS
    normalized = seg.apply_gain(delta)
    out = os.path.join(OUT_DIR, "volume_check.wav")
    normalized.export(out, format="wav")
    os.remove(mp3)
    print(f"  Volume check passage → {out}  ({seg.duration_seconds:.1f}s)")


def normalize_all() -> None:
    """Convert MP3 → WAV and normalize RMS across all stimuli."""
    print("Normalizing audio levels...")
    segments = {}
    for w in WORDS:
        mp3 = os.path.join(OUT_DIR, f"{w}.mp3")
        if not os.path.exists(mp3):
            print(f"  WARNING: {mp3} not found, skipping.")
            continue
        seg = AudioSegment.from_mp3(mp3)
        segments[w] = seg

    if not segments:
        print("  No segments to normalize.")
        return

    # Normalize each segment to -20 dBFS RMS
    target_dBFS = -20.0
    for w, seg in segments.items():
        delta = target_dBFS - seg.dBFS
        normalized = seg.apply_gain(delta)
        out = os.path.join(OUT_DIR, f"{w}.wav")
        normalized.export(out, format="wav")
        # Remove mp3 source
        os.remove(os.path.join(OUT_DIR, f"{w}.mp3"))
        print(f"  {w}.wav  ({seg.duration_seconds*1000:.0f} ms, "
              f"gain applied: {delta:+.1f} dB)")


def main() -> None:
    asyncio.run(synthesize_all())
    asyncio.run(build_volume_check())
    normalize_all()

    print("\n=== Done ===")
    print(f"Files saved to: {OUT_DIR}/")
    print()
    print("Next steps:")
    print("  1. Open stimuli in Praat — check consonant durations across conditions")
    print("  2. Report mean consonant duration (ms) per condition in methods section")
    print("     to address acoustic confound (reviewer comment: 'CCV C 有沒有比較短')")
    print("  3. Run phonotactic probability check:")
    print("     http://www.people.ku.edu/~mvitevit/PhProb.html")
    print("  4. Verify no item is a real English word:")
    print("     https://www.dictionary.com / Wordnik API")


if __name__ == "__main__":
    main()
