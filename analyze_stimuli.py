#!/usr/bin/env python3
"""
Acoustic analysis of CCVC/CVCC stimuli via Praat (parselmouth).

Measures per item:
  - duration_ms        : total file duration
  - rms_dbfs           : RMS level (verify −20 dBFS normalization)
  - vowel_onset_ms     : time to first major intensity rise (proxy for onset cluster duration)
  - voiced_onset_ms    : time to first voiced frame (F0 > 0, prob > 0.5)
  - pitch_mean_hz      : mean F0 over voiced frames
  - pitch_sd_hz        : SD of F0

Outputs stimuli_analysis.csv and prints condition summary.
"""

import os, csv, math
import numpy as np
import parselmouth
from parselmouth.praat import call
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

STIMULI_DIR  = "public/stimuli"
OUT_CSV      = "stimuli_analysis.csv"
SPEC_DIR     = "stimuli_spectrograms"

# Minimal pairs: same consonants, different distribution
PAIRS = [
    ("brep","berp"), ("blef","belf"), ("freb","ferb"), ("flep","felp"),
    ("greb","gerb"), ("glek","gelk"), ("krev","kerv"), ("klev","kelv"),
    ("trep","terp"), ("plev","pelv"), ("drep","derp"), ("dref","derf"),
    ("slek","selk"), ("slem","selm"), ("plek","pelk"), ("preb","perb"),
    ("gref","gerf"), ("glem","gelm"), ("blek","belk"), ("frev","ferv"),
]

CCVC_WORDS = {p[0] for p in PAIRS}
CVCC_WORDS = {p[1] for p in PAIRS}


def condition(word):
    if word in CCVC_WORDS: return "CCVC"
    if word in CVCC_WORDS: return "CVCC"
    return "other"


def sound_start_ms(snd, threshold_db=20.0):
    """Time where sound energy first rises > threshold_db above file minimum."""
    intensity = snd.to_intensity(minimum_pitch=60)
    times  = intensity.xs()
    values = intensity.values.T.flatten()
    floor  = float(np.min(values))
    for t, v in zip(times, values):
        if v > floor + threshold_db:
            return t * 1000
    return 0.0


def vowel_onset_ms(snd):
    """
    Formant-based vowel onset measured from sound_start.
    Finds first frame (after silence) where F1>350 & F2>1000 Hz = vowel /ɛ/.
    Returns time-from-sound-start in ms (= pre-vowel consonant cluster duration).
    """
    t_start = sound_start_ms(snd) / 1000.0
    formants = snd.to_formant_burg(
        time_step=0.005, max_number_of_formants=5,
        maximum_formant=5500, window_length=0.025, pre_emphasis_from=50
    )
    for t in formants.xs():
        if t < t_start: continue  # skip silence
        f1 = formants.get_value_at_time(1, t)
        f2 = formants.get_value_at_time(2, t)
        if (f1 and f2 and not math.isnan(f1) and not math.isnan(f2)
                and f1 > 350 and f2 > 1000):
            return (t - t_start) * 1000  # ms from sound onset
    return None


def onset_rms_dbfs(snd, window_ms=100):
    """RMS of first window_ms after sound_start — measures onset consonant energy."""
    t0  = sound_start_ms(snd) / 1000.0
    end = min(t0 + window_ms / 1000.0, snd.duration)
    snippet = snd.extract_part(t0, end)
    rms = call(snippet, "Get root-mean-square", 0, 0)
    return round(20 * math.log10(max(rms, 1e-10)), 2)


def save_spectrogram(word, snd):
    """Save wideband spectrogram with intensity overlay to SPEC_DIR."""
    os.makedirs(SPEC_DIR, exist_ok=True)
    spec = snd.to_spectrogram(window_length=0.005, maximum_frequency=8000)
    inten = snd.to_intensity(minimum_pitch=60)
    t_start = sound_start_ms(snd) / 1000.0

    fig, ax = plt.subplots(figsize=(6, 2.8))
    # Spectrogram
    ax.imshow(
        np.log10(spec.values + 1e-10),
        origin="lower", aspect="auto",
        extent=[spec.xmin, spec.xmax, spec.ymin / 1000, spec.ymax / 1000],
        cmap="inferno", vmin=-3, vmax=4
    )
    # Intensity (white line, scaled to 0–8 kHz range)
    it = inten.xs()
    iv = (inten.values.T.flatten() - 30) / 80 * 8
    ax.plot(it, iv, "w-", lw=0.8, alpha=0.7)
    # Sound start marker
    ax.axvline(t_start, color="cyan", lw=1, linestyle="--", label="sound start")
    ax.set_title(f"/{word}/", fontsize=11)
    ax.set_ylabel("kHz"); ax.set_xlabel("Time (s)")
    ax.set_ylim(0, 8)
    fig.tight_layout()
    fig.savefig(os.path.join(SPEC_DIR, f"{word}.png"), dpi=110)
    plt.close(fig)


def voiced_onset_ms(snd):
    """Time of first voiced frame (F0 > 0) using array access."""
    pitch = snd.to_pitch(time_step=0.005, pitch_floor=60, pitch_ceiling=450)
    times  = pitch.xs()
    f0vals = pitch.selected_array['frequency']
    for t, f in zip(times, f0vals):
        if f > 60:
            return t * 1000
    return None


def analyze_file(path):
    snd = parselmouth.Sound(path)
    return analyze_snd(snd)


def analyze_snd(snd):
    dur  = snd.duration * 1000

    # RMS dBFS
    rms_raw = call(snd, "Get root-mean-square", 0, 0)
    rms_db  = 20 * math.log10(max(rms_raw, 1e-10))

    # Vowel onset (formant-based: F1>300 & F2>800)
    v_onset = vowel_onset_ms(snd)
    # Onset consonant clarity: RMS of first 80ms
    onset_rms = onset_rms_dbfs(snd, window_ms=80)

    # Voiced onset (pitch-based)
    vd_onset = voiced_onset_ms(snd)

    # Pitch stats via array (parselmouth 0.4+); widen range for TTS male voice
    pitch  = snd.to_pitch(time_step=0.005, pitch_floor=60, pitch_ceiling=450)
    f0vals = pitch.selected_array['frequency'].astype(float)
    voiced = f0vals[np.isfinite(f0vals) & (f0vals > 60)]
    pitch_mean = float(np.mean(voiced))  if len(voiced) > 0 else float("nan")
    pitch_sd   = float(np.std(voiced))   if len(voiced) > 0 else float("nan")

    return {
        "duration_ms":    round(dur, 1),
        "rms_dbfs":       round(rms_db, 2),
        "vowel_onset_ms": round(v_onset, 1) if v_onset is not None else None,
        "voiced_onset_ms":round(vd_onset, 1) if vd_onset is not None else None,
        "onset_rms_dbfs": onset_rms,
        "pitch_mean_hz":  round(pitch_mean, 1),
        "pitch_sd_hz":    round(pitch_sd, 1),
    }


def main():
    rows = []
    wavs = sorted(f for f in os.listdir(STIMULI_DIR) if f.endswith(".wav"))

    for wav in wavs:
        word = wav[:-4]
        if word in ("calibration", "volume_check") or word.startswith("digit_"):
            continue
        path = os.path.join(STIMULI_DIR, wav)
        print(f"  {wav} ...", end=" ", flush=True)
        try:
            snd = parselmouth.Sound(path)
            m = analyze_snd(snd)
            m["word"] = word
            m["condition"] = condition(word)
            rows.append(m)
            v = m['vowel_onset_ms']
            vstr = f"{v:.0f}ms" if v is not None else "n/a"
            print(f"{m['duration_ms']:.0f}ms  {m['rms_dbfs']:.1f}dBFS  "
                  f"prevowel={vstr}  onset_rms={m['onset_rms_dbfs']:.1f}dBFS")
            # Spectrogram for bl-/sl- items and their CVCC partners
            if any(word.startswith(p) for p in ("bl","sl","bel","sel")):
                save_spectrogram(word, snd)
        except Exception as e:
            print(f"ERROR: {e}")

    # Write CSV
    fields = ["word","condition","duration_ms","rms_dbfs",
              "vowel_onset_ms","voiced_onset_ms","onset_rms_dbfs","pitch_mean_hz","pitch_sd_hz"]
    with open(OUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nSaved {OUT_CSV}")

    # Summary by condition
    print("\n── Condition summary ──────────────────────────────────────────")
    for cond in ("CCVC", "CVCC"):
        subset = [r for r in rows if r["condition"] == cond]
        def stat(key):
            vals = [r[key] for r in subset
                    if r[key] is not None and not (isinstance(r[key], float) and math.isnan(r[key]))]
            return f"{np.mean(vals):.1f} ± {np.std(vals):.1f}" if vals else "n/a"
        print(f"\n{cond}  (n={len(subset)})")
        print(f"  duration_ms     : {stat('duration_ms')}")
        print(f"  rms_dbfs        : {stat('rms_dbfs')}")
        print(f"  vowel_onset_ms  : {stat('vowel_onset_ms')}  ← CC should be > C")
        print(f"  voiced_onset_ms : {stat('voiced_onset_ms')}")
        print(f"  onset_rms_dbfs  : {stat('onset_rms_dbfs')}  ← onset clarity (higher = clearer)")
        print(f"  pitch_mean_hz   : {stat('pitch_mean_hz')}")

    # Flag duration outliers
    print("\n── Outliers (duration < 600ms or > 1100ms) ──────────────────")
    found = False
    for r in rows:
        if r["duration_ms"] < 600 or r["duration_ms"] > 1100:
            print(f"  {r['word']:10s}  {r['duration_ms']:.0f}ms  [{r['condition']}]")
            found = True
    if not found: print("  none")

    # Onset clarity: flag items where onset RMS is > 15dB below condition mean
    # (possible weak/reduced onset consonant)
    print("\n── Low onset clarity (onset_rms > 15 dB below condition mean) ──")
    found = False
    for cond in ("CCVC", "CVCC"):
        subset = [r for r in rows if r["condition"] == cond]
        vals   = [r["onset_rms_dbfs"] for r in subset]
        mean   = float(np.mean(vals))
        for r in subset:
            if r["onset_rms_dbfs"] < mean - 15:
                print(f"  {r['word']:10s}  onset_rms={r['onset_rms_dbfs']:.1f}dBFS  "
                      f"(mean={mean:.1f})  [{cond}]  ← weak onset")
                found = True
    if not found: print("  none")

    # bl- specific check
    print("\n── bl- onset items (onset clarity) ──────────────────────────")
    for r in sorted(rows, key=lambda x: x["word"]):
        if r["word"].startswith("bl") or r["word"].startswith("sl"):
            print(f"  {r['word']:10s}  onset_rms={r['onset_rms_dbfs']:.1f}dBFS  "
                  f"vowel@{r['vowel_onset_ms']}ms  [{r['condition']}]")


if __name__ == "__main__":
    main()
