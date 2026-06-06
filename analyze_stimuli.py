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

STIMULI_DIR = "public/stimuli"
OUT_CSV     = "stimuli_analysis.csv"

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


def vowel_onset_ms(snd, threshold_db=15.0):
    """Time of first intensity rise > threshold_db above 10th-percentile baseline."""
    intensity = snd.to_intensity(minimum_pitch=75)
    times  = intensity.xs()
    values = intensity.values.T.flatten()
    baseline = float(np.percentile(values, 10))
    for t, v in zip(times, values):
        if v > baseline + threshold_db:
            return t * 1000
    return times[0] * 1000


def voiced_onset_ms(snd):
    """Time of first voiced frame (F0 > 0) using array access."""
    pitch = snd.to_pitch(time_step=0.005, pitch_floor=75, pitch_ceiling=400)
    times  = pitch.xs()
    f0vals = pitch.selected_array['frequency']   # 0 = unvoiced
    for t, f in zip(times, f0vals):
        if f > 75:
            return t * 1000
    return None


def analyze_file(path):
    snd  = parselmouth.Sound(path)
    dur  = snd.duration * 1000

    # RMS dBFS
    rms_raw = call(snd, "Get root-mean-square", 0, 0)
    rms_db  = 20 * math.log10(max(rms_raw, 1e-10))

    # Vowel onset (intensity-based)
    v_onset = vowel_onset_ms(snd)

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
            m = analyze_file(path)
            m["word"] = word
            m["condition"] = condition(word)
            rows.append(m)
            print(f"{m['duration_ms']:.0f}ms  {m['rms_dbfs']:.1f}dBFS  "
                  f"vowel@{m['vowel_onset_ms']:.0f}ms")
        except Exception as e:
            print(f"ERROR: {e}")

    # Write CSV
    fields = ["word","condition","duration_ms","rms_dbfs",
              "vowel_onset_ms","voiced_onset_ms","pitch_mean_hz","pitch_sd_hz"]
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
        print(f"  vowel_onset_ms  : {stat('vowel_onset_ms')}")
        print(f"  voiced_onset_ms : {stat('voiced_onset_ms')}")
        print(f"  pitch_mean_hz   : {stat('pitch_mean_hz')}")

    # Flag outliers
    print("\n── Outliers (duration < 600ms or > 1100ms) ──────────────────")
    for r in rows:
        if r["duration_ms"] < 600 or r["duration_ms"] > 1100:
            print(f"  {r['word']:10s}  {r['duration_ms']:.0f}ms  [{r['condition']}]")


if __name__ == "__main__":
    main()
