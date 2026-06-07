#!/usr/bin/env python3
"""
Generate nonce word audio stimuli via edge-tts (Microsoft Azure Neural, free).

Install:
    uv pip install edge-tts pydub

Run:
    python generate_stimuli.py
Output: public/stimuli/*.wav, all RMS-normalized to -20 dBFS.
"""

import asyncio, os, sys
from pydub import AudioSegment

VOICE       = "en-US-EricNeural"
RATE        = "-10%"           # slightly slower for cluster clarity
TARGET_DBFS = -20.0
OUT_DIR     = "public/stimuli"

# -- Stimulus lists ------------------------------------------------------------
PAIRS = [
    ("spef", "fesp"), ("spek", "kesp"), ("spet", "tesp"), ("speb", "besp"),
    ("spev", "vesp"), ("speg", "gesp"), ("slep", "lesp"), ("snep", "nesp"),
    ("smep", "mesp"), ("skef", "fesk"), ("skev", "vesk"), ("skem", "mesk"),
    ("slek", "lesk"), ("snek", "nesk"), ("smet", "mest"), ("stek", "tesk"),
    ("stef", "seft"), ("klet", "lekt"), ("pret", "rept"), ("kres", "reks"),
]

CCCVC_PAIRS = [
    ("stref", "frest"), ("streg", "grest"),
    ("spref", "fresp"), ("spreg", "gresp"), ("sprek", "kresp"),
    ("spreb", "bresp"), ("spret", "tresp"),
    ("skref", "fresk"), ("skreg", "gresk"), ("skrep", "presk"),
    ("skreb", "bresk"), ("skret", "tresk"),
    ("splef", "flesp"), ("spleg", "glesp"), ("splek", "klesp"), ("splet", "plest"),
]

VCCC_WORDS = ["ekst", "espt", "epts", "epst"]

WORDS = (
    [p[0] for p in PAIRS] +
    [p[1] for p in PAIRS] +
    [p[0] for p in CCCVC_PAIRS] +
    [p[1] for p in CCCVC_PAIRS] +
    VCCC_WORDS
)

DIGIT_WORDS = {
    '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
    '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
}

VOLUME_CHECK_TEXT = (
    "This is a sound check for the speech memory study. "
    "You will hear short nonsense words like spef, fesk, and ekst. "
    "Please adjust your volume until this voice sounds clear and comfortable. "
    "When you are ready, press continue."
)


# -- edge-tts helpers ----------------------------------------------------------

async def _synth_mp3(text: str, out_mp3: str, retries: int = 3) -> None:
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts not found. Run: uv pip install edge-tts pydub")
    for attempt in range(retries):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            await comm.save(out_mp3)
            return
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(1 + attempt)
            else:
                raise


def _mp3_to_wav(mp3: str, wav: str) -> int:
    seg = AudioSegment.from_mp3(mp3)
    seg.apply_gain(TARGET_DBFS - seg.dBFS).export(wav, format="wav")
    os.remove(mp3)
    return len(seg)


# -- Main synthesis functions --------------------------------------------------

async def synthesize_all() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Synthesizing {len(WORDS)} stimuli with {VOICE} (rate={RATE})...")
    for word in WORDS:
        mp3 = os.path.join(OUT_DIR, f"{word}.mp3")
        wav = os.path.join(OUT_DIR, f"{word}.wav")
        await _synth_mp3(word, mp3)
        dur = _mp3_to_wav(mp3, wav)
        print(f"  {word}  {dur}ms")
        await asyncio.sleep(0.4)   # avoid Microsoft rate-limit
    print("Done.")


async def synthesize_digits() -> None:
    print("Synthesizing digits 1-9...")
    for n, word in DIGIT_WORDS.items():
        mp3 = os.path.join(OUT_DIR, f"digit_{n}.mp3")
        wav = os.path.join(OUT_DIR, f"digit_{n}.wav")
        await _synth_mp3(word, mp3)
        _mp3_to_wav(mp3, wav)
        print(f"  digit_{n}.wav  ({word})")
        await asyncio.sleep(0.4)
    print("Done.")


async def build_volume_check() -> None:
    mp3 = os.path.join(OUT_DIR, "volume_check.mp3")
    wav = os.path.join(OUT_DIR, "volume_check.wav")
    await _synth_mp3(VOLUME_CHECK_TEXT, mp3)
    dur = _mp3_to_wav(mp3, wav)
    print(f"  volume_check.wav  ({dur/1000:.1f}s)")


async def main() -> None:
    await synthesize_all()
    await synthesize_digits()
    await build_volume_check()
    print(f"\n=== Done === Files saved to: {OUT_DIR}/")


if __name__ == "__main__":
    asyncio.run(main())
