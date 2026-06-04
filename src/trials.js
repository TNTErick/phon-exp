import { CCVC_ITEMS, CVCC_ITEMS } from './stimuli.js';

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Ensure the same consonant pair (probe + foil) doesn't reappear within min_lag trials.
function arrangeWithMinLag(trials, min_lag) {
  const result = [];
  const pool = [...trials];
  while (pool.length > 0) {
    const recent = new Set(
      result.slice(-min_lag).flatMap(t => [t.probe.id, t.probe.foil])
    );
    let pick = pool.findIndex(t =>
      !recent.has(t.probe.id) && !recent.has(t.probe.foil)
    );
    if (pick === -1) {
      const probeOnly = new Set(result.slice(-min_lag).map(t => t.probe.id));
      pick = pool.findIndex(t => !probeOnly.has(t.probe.id));
    }
    if (pick === -1) pick = 0;
    result.push(pool.splice(pick, 1)[0]);
  }
  return result;
}

// Build fully interleaved CCVC+CVCC trials with MIN_LAG=7 applied.
export function buildInterleavedTrials(n_per_condition) {
  const MIN_LAG = 7;
  const raw = [];
  for (const pool of [CCVC_ITEMS, CVCC_ITEMS]) {
    for (let t = 0; t < n_per_condition; t++) {
      const seq = shuffle(pool).slice(0, 3);
      const probe_pos = Math.floor(Math.random() * 3);
      raw.push({ seq, probe_pos, probe: seq[probe_pos] });
    }
  }
  return arrangeWithMinLag(shuffle(raw), MIN_LAG);
}

// Build digit span sequences: lengths 3–9, 2 trials each.
export function buildDigitSequences() {
  const seqs = [];
  for (let len = 3; len <= 9; len++) {
    for (let trial = 0; trial < 2; trial++) {
      const digits = [];
      for (let i = 0; i < len; i++) {
        let d;
        do { d = Math.floor(Math.random() * 9) + 1; }
        while (digits.length > 0 && d === digits[digits.length - 1]);
        digits.push(d);
      }
      seqs.push({ digits, len, trial });
    }
  }
  return seqs;
}
