import { CCVC_ITEMS, CVCC_ITEMS, CCCVC_ITEMS, CCVCC_ITEMS, VCCC_ITEMS } from './stimuli.js';

const ALL_ITEMS = [...CCVC_ITEMS, ...CVCC_ITEMS, ...CCCVC_ITEMS, ...CCVCC_ITEMS, ...VCCC_ITEMS];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findItem(id) {
  return ALL_ITEMS.find(x => x.id === id) ?? null;
}

// Extract consonant set from an item. Vowel is always 'e'.
// 4-char items: CCVC CC-e-C [0,1,3] | CVCC C-e-CC [0,2,3] | VCCC e-CCC [1,2,3]
// 5-char items: CCCVC CCC-e-C [0,1,2,4] | CCVCC CC-e-CC [0,1,3,4]
function consonants(item) {
  const w = item.id;
  switch (item.condition) {
    case 'CCVC':  return new Set([w[0], w[1], w[3]]);
    case 'CVCC':  return new Set([w[0], w[2], w[3]]);
    case 'VCCC':  return new Set([w[1], w[2], w[3]]);
    case 'CCCVC': return new Set([w[0], w[1], w[2], w[4]]);
    case 'CCVCC': return new Set([w[0], w[1], w[3], w[4]]);
    default:      return new Set();
  }
}

function consonantOverlap(a, b) {
  const ca = consonants(a), cb = consonants(b);
  let n = 0;
  for (const c of ca) if (cb.has(c)) n++;
  return n;
}

function arrangeWithMinLag(trials, min_lag) {
  const result = [];
  const pool = [...trials];
  while (pool.length > 0) {
    const recentIds = new Set(
      result.slice(-min_lag).flatMap(t => t.probes.map(p => p.id))
    );
    let pick = pool.findIndex(t => !t.probes.some(p => recentIds.has(p.id)));
    if (pick === -1) pick = 0;
    result.push(pool.splice(pick, 1)[0]);
  }
  return result;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Build 9 probes for one trial.
//
// CCVC/CVCC/CCCVC/CCVCC (have foil defined):
//   3 targets  — randomly drawn from the heard sequence (in_list: true)
//   2 Type I   — same condition, ≥2 shared consonants with a seq item (in_list: false)
//   2 Type II  — minimal pair partner of a seq item, opposite condition (in_list: false)
//   2 Type III — random from ALL_ITEMS minus Type I/II used set;
//                seq items not excluded → can become targets (in_list: true)
//
// VCCC (foil: null, no minimal pairs defined):
//   3 targets + 6 cross-condition random foils
function buildProbes(seq, pool) {
  const seqIds   = new Set(seq.map(x => x.id));
  const isAnchor = !pool[0].foil;

  const targets = shuffle(seq)
    .slice(0, Math.min(3, seq.length))
    .map(x => ({ ...x, in_list: true, foil_type: 'target' }));
  const usedIds = new Set(seqIds);

  if (isAnchor) {
    const foils = shuffle(ALL_ITEMS.filter(x => !usedIds.has(x.id)))
      .slice(0, 6)
      .map(x => ({ ...x, in_list: false, foil_type: 'cross_condition' }));
    return shuffle([...targets, ...foils].slice(0, 9));
  }

  // Type I: same condition, ≥2 shared consonants, not in seq
  const type1 = [];
  for (const x of shuffle(pool.filter(x => !usedIds.has(x.id) && seq.some(s => consonantOverlap(x, s) >= 2)))) {
    if (type1.length >= 2) break;
    type1.push({ ...x, in_list: false, foil_type: 'type1_consonant' });
    usedIds.add(x.id);
  }

  // Type II: minimal pair partners of seq items (opposite condition)
  const type2 = [];
  for (const s of shuffle([...seq])) {
    if (type2.length >= 2) break;
    const partner = findItem(s.foil);
    if (partner && !usedIds.has(partner.id)) {
      type2.push({ ...partner, in_list: false, foil_type: 'type2_structure' });
      usedIds.add(partner.id);
    }
  }

  // Type III: random from ALL_ITEMS minus used set; seq items allowed → become targets
  const type3 = [];
  for (const x of shuffle(ALL_ITEMS.filter(x => !usedIds.has(x.id)))) {
    if (type3.length >= 2) break;
    type3.push({ ...x, in_list: seqIds.has(x.id), foil_type: 'type3_random' });
    usedIds.add(x.id);
  }

  // Pad to 9 if any type came up short
  const probes = [...targets, ...type1, ...type2, ...type3];
  const allUsed = new Set(probes.map(x => x.id));
  for (const x of shuffle(ALL_ITEMS.filter(x => !allUsed.has(x.id)))) {
    if (probes.length >= 9) break;
    probes.push({ ...x, in_list: seqIds.has(x.id), foil_type: 'fallback' });
    allUsed.add(x.id);
  }

  return shuffle(probes.slice(0, 9));
}

// Practice trials — CCVC/CVCC only, 4 probes (2 targets + 2 same-condition foils).
export function buildPracticeTrials(n = 2) {
  const raw = [];
  for (const pool of [CCVC_ITEMS, CVCC_ITEMS]) {
    const seq    = shuffle(pool).slice(0, 6);
    const seqIds = new Set(seq.map(x => x.id));
    const targets = shuffle(seq).slice(0, 2)
      .map(x => ({ ...x, in_list: true, foil_type: 'target' }));
    const foils = shuffle(pool.filter(x => !seqIds.has(x.id))).slice(0, 2)
      .map(x => ({ ...x, in_list: false, foil_type: 'foil' }));
    raw.push({ seq, probes: shuffle([...targets, ...foils]), condition: pool[0].condition });
  }
  return shuffle(raw).slice(0, n);
}

// Main experiment — all 5 conditions, 9 probes per trial.
// Returns 7 blocks of 4 trials (28 total).
//
// Syllable counts: 84 items × ~2 appearances ≈ 168 = 28 × 6
//   CCVC  : 7 trials × 6 = 42 slots  (20 items, ~2.1 each)
//   CVCC  : 7 trials × 6 = 42 slots
//   CCCVC : 6 trials × 6 = 36 slots  (17 items, ~2.1 each)
//   CCVCC : 6 trials × 6 = 36 slots
//   VCCC  : 2 trials × 6 = 12 slots  (10 items, 1.2 each)
// Cycle pool items twice, chunk into n_trials × seq_len.
// Each item appears floor or ceil(n_trials*seq_len / pool.length) times — ~2 each.
// No item appears twice in the same trial (guaranteed when pool.length > seq_len).
function cycleTrials(pool, n_trials, seq_len) {
  const needed = n_trials * seq_len;
  const instances = [];
  for (let pass = 0; instances.length < needed; pass++) {
    instances.push(...shuffle([...pool]));
  }
  const flat = instances.slice(0, needed);
  return Array.from({ length: n_trials }, (_, i) =>
    flat.slice(i * seq_len, (i + 1) * seq_len)
  );
}

export function buildAllTrials() {
  const make = (pool, n, seq_len) =>
    cycleTrials(pool, n, seq_len).map(seq => ({
      seq, probes: buildProbes(seq, pool), condition: pool[0].condition,
    }));

  const all = [
    ...make(CCVC_ITEMS,  7, 6),
    ...make(CVCC_ITEMS,  7, 6),
    ...make(CCCVC_ITEMS, 6, 6),
    ...make(CCVCC_ITEMS, 6, 6),
    ...make(VCCC_ITEMS,  2, 6),
  ];

  return chunk(arrangeWithMinLag(shuffle(all), 3), 4); // 7 blocks of 4
}

// Generate one random digit sequence of given length (no consecutive repeats).
export function generateDigits(len) {
  const digits = [];
  for (let i = 0; i < len; i++) {
    let d;
    do { d = Math.floor(Math.random() * 9) + 1; }
    while (digits.length > 0 && d === digits[digits.length - 1]);
    digits.push(d);
  }
  return digits;
}
