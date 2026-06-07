#!/usr/bin/env python3
"""
Generate nonce word audio stimuli using Kokoro-82M TTS (local, no API key).

Install:
    uv pip install kokoro soundfile pydub

Run:
    python generate_stimuli.py
Output: public/stimuli/*.wav, all RMS-normalized to -20 dBFS.
"""

import os, sys
import numpy as np
import soundfile as sf
from pydub import AudioSegment

VOICE       = "am_adam"   # American English male
SPEED       = 0.85        # slightly slower for cluster clarity
TARGET_DBFS = -20.0
SAMPLE_RATE = 24000
OUT_DIR     = "public/stimuli"

# IPA pronunciations — all vowel /ɛ/ — used to bypass misaki G2P.
# Misaki returns ❓ for most nonwords, causing Kokoro's fallback to insert a
# spurious schwa. Patching g2p to return explicit IPA fixes this.
IPA_MAP = {
    # CCVC (2-onset, 1-coda)
    'spef': 'spɛf', 'spek': 'spɛk', 'spet': 'spɛt', 'speb': 'spɛb',
    'spev': 'spɛv', 'speg': 'spɛɡ', 'slep': 'slɛp', 'snep': 'snɛp',
    'smep': 'smɛp', 'skef': 'skɛf', 'skev': 'skɛv', 'skem': 'skɛm',
    'slek': 'slɛk', 'snek': 'snɛk', 'smet': 'smɛt', 'stek': 'stɛk',
    'stef': 'stɛf', 'klet': 'klɛt', 'pret': 'pɹɛt', 'kres': 'kɹɛs',
    # CVCC (1-onset, 2-obstruent-coda)
    'fesp': 'fɛsp', 'kesp': 'kɛsp', 'tesp': 'tɛsp', 'besp': 'bɛsp',
    'vesp': 'vɛsp', 'gesp': 'ɡɛsp', 'lesp': 'lɛsp', 'nesp': 'nɛsp',
    'mesp': 'mɛsp', 'fesk': 'fɛsk', 'vesk': 'vɛsk', 'mesk': 'mɛsk',
    'lesk': 'lɛsk', 'nesk': 'nɛsk', 'mest': 'mɛst', 'tesk': 'tɛsk',
    'seft': 'sɛft', 'lekt': 'lɛkt', 'rept': 'ɹɛpt', 'reks': 'ɹɛks',
    # CCCVC (3-onset, 1-coda)
    'stref': 'stɹɛf', 'streg': 'stɹɛɡ',
    'spref': 'spɹɛf', 'spreg': 'spɹɛɡ', 'sprek': 'spɹɛk',
    'spreb': 'spɹɛb', 'spret': 'spɹɛt',
    'skref': 'skɹɛf', 'skreg': 'skɹɛɡ', 'skrep': 'skɹɛp',
    'skreb': 'skɹɛb', 'skret': 'skɹɛt',
    'splef': 'splɛf', 'spleg': 'splɛɡ', 'splek': 'splɛk', 'splet': 'splɛt',
    # CCVCC (2-onset, 2-obstruent-coda)
    'frest': 'fɹɛst', 'grest': 'ɡɹɛst',
    'fresp': 'fɹɛsp', 'gresp': 'ɡɹɛsp', 'kresp': 'kɹɛsp',
    'bresp': 'bɹɛsp', 'tresp': 'tɹɛsp',
    'fresk': 'fɹɛsk', 'gresk': 'ɡɹɛsk', 'presk': 'pɹɛsk',
    'bresk': 'bɹɛsk', 'tresk': 'tɹɛsk',
    'flesp': 'flɛsp', 'glesp': 'ɡlɛsp', 'klesp': 'klɛsp', 'plest': 'plɛst',
    # VCCC (0-onset, 3-obstruent-coda)
    'ekst': 'ɛkst', 'ekts': 'ɛkts', 'eskt': 'ɛskt',
    'espt': 'ɛspt', 'epts': 'ɛpts', 'epst': 'ɛpst',
    # Digit words — real words but patched for consistency
    'one': 'wʌn', 'two': 'tuː', 'three': 'θɹiː', 'four': 'fɔɹ',
    'five': 'faɪv', 'six': 'sɪks', 'seven': 'sɛvən', 'eight': 'eɪt',
    'nine': 'naɪn',
}

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

VCCC_WORDS = ["ekst", "ekts", "eskt", "espt", "epts", "epst"]

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


# -- Kokoro pipeline -----------------------------------------------------------

_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        try:
            from kokoro import KPipeline
            _pipeline = KPipeline(lang_code='a')   # 'a' = American English
        except ImportError:
            sys.exit("kokoro not found. Run: uv pip install kokoro soundfile pydub")
    return _pipeline


def synth(text: str) -> np.ndarray:
    """Synthesize text to a numpy float32 array at SAMPLE_RATE Hz."""
    pipe = get_pipeline()
    chunks = []
    for _, _, audio in pipe(text, voice=VOICE, speed=SPEED):
        if audio is not None and len(audio) > 0:
            chunks.append(audio)
    if not chunks:
        raise RuntimeError(f"No audio generated for: {text!r}")
    return np.concatenate(chunks).astype(np.float32)


def save_normalized(audio: np.ndarray, out_wav: str) -> float:
    """Write WAV and normalize to TARGET_DBFS; return gain applied (dB)."""
    sf.write(out_wav, audio, SAMPLE_RATE)
    seg = AudioSegment.from_wav(out_wav)
    delta = TARGET_DBFS - seg.dBFS
    seg.apply_gain(delta).export(out_wav, format="wav")
    return delta


# -- Main synthesis functions --------------------------------------------------

def synthesize_all() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Synthesizing {len(WORDS)} stimuli with Kokoro-82M ({VOICE}, speed={SPEED})...")
    for word in WORDS:
        out = os.path.join(OUT_DIR, f"{word}.wav")
        print(f"  {word}", end="  ", flush=True)
        try:
            audio = synth(word)
            delta = save_normalized(audio, out)
            dur_ms = len(audio) / SAMPLE_RATE * 1000
            print(f"{dur_ms:.0f}ms  {delta:+.1f}dB")
        except Exception as e:
            print(f"ERROR: {e}")
    print("Done.")


def synthesize_digits() -> None:
    print("Synthesizing digits 1-9...")
    for n, word in DIGIT_WORDS.items():
        out = os.path.join(OUT_DIR, f"digit_{n}.wav")
        audio = synth(word)
        save_normalized(audio, out)
        print(f"  digit_{n}.wav  ({word})")
    print("Done.")


def build_volume_check() -> None:
    out = os.path.join(OUT_DIR, "volume_check.wav")
    audio = synth(VOLUME_CHECK_TEXT)
    delta = save_normalized(audio, out)
    dur_s = len(audio) / SAMPLE_RATE
    print(f"  volume_check.wav  ({dur_s:.1f}s  {delta:+.1f}dB)")


def main() -> None:
    synthesize_all()
    synthesize_digits()
    build_volume_check()
    print(f"\n=== Done === Files saved to: {OUT_DIR}/")
    print("Next: run analyze_stimuli.py to verify durations and RMS.")


if __name__ == "__main__":
    main()
