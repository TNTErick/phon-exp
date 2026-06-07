#!/usr/bin/env python3
"""
Generate nonce word audio stimuli via Google Cloud TTS (Neural2 + SSML IPA).

SSML <phoneme alphabet="ipa"> bypasses the TTS grapheme-to-phoneme system,
guaranteeing exact pronunciation of nonwords regardless of spelling.

Requires:
    uv pip install google-cloud-texttospeech pydub

Authentication (one-time):
    gcloud auth application-default login
    # OR: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account.json

Billing: Neural2 voices — 1 M chars/month free tier. This script uses ~300 chars.

Run:
    python generate_stimuli.py
Output: public/stimuli/*.wav, all RMS-normalized to -20 dBFS.
"""

import os, sys
from pydub import AudioSegment
from concurrent.futures import ThreadPoolExecutor, as_completed

VOICE_NAME    = "en-US-Neural2-D"   # clear male Neural2 voice; IPA phoneme tags supported
LANGUAGE      = "en-US"
SPEAKING_RATE = 0.85                # slightly slower for consonant cluster clarity
TARGET_DBFS   = -20.0
OUT_DIR       = "public/stimuli"

# -- Stimulus lists ------------------------------------------------------------
# CCVC/CVCC minimal pairs: same consonant set, CVCC coda always two obstruents.
# All-obstruent codas eliminate rhoticity ambiguity (CVrC ~ CVC perceptually).
PAIRS = [
    ("spef", "fesp"), ("spek", "kesp"), ("spet", "tesp"), ("speb", "besp"),
    ("spev", "vesp"), ("speg", "gesp"), ("slep", "lesp"), ("snep", "nesp"),
    ("smep", "mesp"), ("skef", "fesk"), ("skev", "vesk"), ("skem", "mesk"),
    ("slek", "lesk"), ("snek", "nesk"), ("smet", "mest"), ("stek", "tesk"),
    ("stef", "seft"), ("klet", "lekt"), ("pret", "rept"), ("kres", "reks"),
]

CCCV_WORDS = ["stre", "spre", "skre", "sple"]                          # 3-onset, 0-coda
VCCC_WORDS = ["ekst", "ekts", "eskt", "espt", "epts", "epst"]          # 0-onset, 3-coda

WORDS = (
    [p[0] for p in PAIRS] +   # 20 CCVC
    [p[1] for p in PAIRS] +   # 20 CVCC
    CCCV_WORDS +
    VCCC_WORDS
)

# -- IPA pronunciations — vowel /e/ throughout --------------------------------
# Passed to <phoneme alphabet="ipa" ph="..."> so TTS produces the exact sequence.
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
    # CCCV (3-onset, 0-coda — open syllable)
    'stre': 'stɹɛ', 'spre': 'spɹɛ', 'skre': 'skɹɛ', 'sple': 'splɛ',
    # VCCC (0-onset, 3-obstruent-coda)
    'ekst': 'ɛkst', 'ekts': 'ɛkts', 'eskt': 'ɛskt',
    'espt': 'ɛspt', 'epts': 'ɛpts', 'epst': 'ɛpst',
}

DIGIT_WORDS = {
    '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
    '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
}

VOLUME_CHECK_TEXT = (
    "This is a sound check for the speech memory study. "
    "You will hear short nonsense words like spef, fesk, and ekst. "
    "Please adjust your volume until this voice sounds clear and comfortable — "
    "not too quiet, not too loud. "
    "When you are ready, press continue."
)


# -- Google Cloud TTS helpers --------------------------------------------------

def _client():
    try:
        from google.cloud import texttospeech
        return texttospeech.TextToSpeechClient()
    except ImportError:
        sys.exit("Missing dependency. Run: uv pip install google-cloud-texttospeech pydub")


def _voice():
    from google.cloud import texttospeech
    return texttospeech.VoiceSelectionParams(language_code=LANGUAGE, name=VOICE_NAME)


def _audio_cfg():
    from google.cloud import texttospeech
    return texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=SPEAKING_RATE,
    )


def _call(client, inp, out_mp3: str) -> None:
    r = client.synthesize_speech(input=inp, voice=_voice(), audio_config=_audio_cfg())
    with open(out_mp3, "wb") as f:
        f.write(r.audio_content)


def _mp3_to_wav(mp3: str, wav: str) -> None:
    seg = AudioSegment.from_mp3(mp3)
    seg.apply_gain(TARGET_DBFS - seg.dBFS).export(wav, format="wav")
    os.remove(mp3)


# -- Main synthesis functions --------------------------------------------------

def synthesize_all() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    c = _client()
    print(f"Synthesizing {len(WORDS)} words via {VOICE_NAME} with IPA phoneme tags...")

    def do_one(word):
        from google.cloud import texttospeech
        ipa  = IPA_MAP[word]
        ssml = f'<speak><phoneme alphabet="ipa" ph="{ipa}">{word}</phoneme></speak>'
        _call(c, texttospeech.SynthesisInput(ssml=ssml),
              os.path.join(OUT_DIR, f"{word}.mp3"))
        return word

    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(do_one, w): w for w in WORDS if w in IPA_MAP}
        for fut in as_completed(futs):
            w = futs[fut]
            try:
                fut.result()
                print(f"  {w}.mp3")
            except Exception as e:
                print(f"  ERROR {w}: {e}")
    print("  Done.")


def synthesize_digits() -> None:
    from google.cloud import texttospeech
    c = _client()
    print("Synthesizing digits 1-9...")
    for n, word in DIGIT_WORDS.items():
        mp3 = os.path.join(OUT_DIR, f"digit_{n}.mp3")
        _call(c, texttospeech.SynthesisInput(text=word), mp3)
        _mp3_to_wav(mp3, os.path.join(OUT_DIR, f"digit_{n}.wav"))
        print(f"  digit_{n}.wav  ({word})")
    print("  Done.")


def build_volume_check() -> None:
    from google.cloud import texttospeech
    c   = _client()
    mp3 = os.path.join(OUT_DIR, "volume_check.mp3")
    _call(c, texttospeech.SynthesisInput(text=VOLUME_CHECK_TEXT), mp3)
    seg = AudioSegment.from_mp3(mp3)
    seg.apply_gain(TARGET_DBFS - seg.dBFS).export(
        os.path.join(OUT_DIR, "volume_check.wav"), format="wav"
    )
    os.remove(mp3)
    print(f"  volume_check.wav  ({seg.duration_seconds:.1f}s)")


def normalize_all() -> None:
    """Convert any remaining MP3s to normalized WAV (fallback for partial runs)."""
    print("Normalizing audio levels...")
    count = 0
    for w in WORDS:
        mp3 = os.path.join(OUT_DIR, f"{w}.mp3")
        if not os.path.exists(mp3):
            continue
        _mp3_to_wav(mp3, os.path.join(OUT_DIR, f"{w}.wav"))
        print(f"  {w}.wav")
        count += 1
    if count:
        print(f"  {count} files normalized.")


def main() -> None:
    synthesize_all()
    synthesize_digits()
    build_volume_check()
    normalize_all()

    print("\n=== Done ===")
    print(f"Files saved to: {OUT_DIR}/")
    print()
    print("Next steps:")
    print("  1. Open stimuli in Praat -- verify cluster durations per condition")
    print("  2. Phonotactic probability: http://www.people.ku.edu/~mvitevit/PhProb.html")


if __name__ == "__main__":
    main()
