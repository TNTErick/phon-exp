// ── MINIMAL PAIRS ─────────────────────────────────────────────────────────
// 20 CCVC/CVCC pairs, vowel /ɛ/ throughout.
// Same consonants C1+C2+C3, different distribution:
//   CCVC: onset cluster C1C2, single coda C3
//   CVCC: single onset C1, coda cluster C2C3
// All verified English nonwords. C2 = /r/ or /l/ (10 each).

export const PAIRS = [
  // ── CCVC/CVCC pairs — same consonant set, CVCC coda always two obstruents ──
  // Eliminates rhoticity ambiguity of liquid/rhotic coda clusters (CVrC ≈ CVC perceptually)
  { ccvc: 'spef', cvcc: 'fesp' },  // sp / -sp  {s,p,f}
  { ccvc: 'spek', cvcc: 'kesp' },  // sp / -sp  {s,p,k}
  { ccvc: 'spet', cvcc: 'tesp' },  // sp / -sp  {s,p,t}  ← minimal triple with espt
  { ccvc: 'speb', cvcc: 'besp' },  // sp / -sp  {s,p,b}
  { ccvc: 'spev', cvcc: 'vesp' },  // sp / -sp  {s,p,v}
  { ccvc: 'speg', cvcc: 'gesp' },  // sp / -sp  {s,p,g}
  { ccvc: 'slep', cvcc: 'lesp' },  // sl / -sp  {s,l,p}
  { ccvc: 'snep', cvcc: 'nesp' },  // sn / -sp  {s,n,p}
  { ccvc: 'smep', cvcc: 'mesp' },  // sm / -sp  {s,m,p}
  { ccvc: 'skef', cvcc: 'fesk' },  // sk / -sk  {s,k,f}
  { ccvc: 'skev', cvcc: 'vesk' },  // sk / -sk  {s,k,v}
  { ccvc: 'skem', cvcc: 'mesk' },  // sk / -sk  {s,k,m}
  { ccvc: 'slek', cvcc: 'lesk' },  // sl / -sk  {s,l,k}
  { ccvc: 'snek', cvcc: 'nesk' },  // sn / -sk  {s,n,k}
  { ccvc: 'smet', cvcc: 'mest' },  // sm / -st  {s,m,t}
  { ccvc: 'stek', cvcc: 'tesk' },  // st / -sk  {s,t,k}  ← minimal triple with eskt
  { ccvc: 'stef', cvcc: 'seft' },  // st / -ft  {s,t,f}
  { ccvc: 'klet', cvcc: 'lekt' },  // kl / -kt  {k,l,t}
  { ccvc: 'pret', cvcc: 'rept' },  // pr / -pt  {p,r,t}
  { ccvc: 'kres', cvcc: 'reks' },  // kr / -ks  {k,r,s}
];

const BASE = import.meta.env.BASE_URL;

export const ITEMS = PAIRS.flatMap(p => [
  { id: p.ccvc, foil: p.cvcc, condition: 'CCVC', onset_n: 2, coda_n: 1,
    audio: `${BASE}stimuli/${p.ccvc}.wav` },
  { id: p.cvcc, foil: p.ccvc, condition: 'CVCC', onset_n: 1, coda_n: 2,
    audio: `${BASE}stimuli/${p.cvcc}.wav` },
]);

export const CCVC_ITEMS = ITEMS.filter(x => x.condition === 'CCVC');
export const CVCC_ITEMS = ITEMS.filter(x => x.condition === 'CVCC');

// ── Phase 2 gradient anchors ────────────────────────────────────────────────
export const CCCV_ITEMS = ['stre', 'spre', 'skre', 'sple'].map(id => ({
  id, foil: null, condition: 'CCCV', onset_n: 3, coda_n: 0,
  audio: `${BASE}stimuli/${id}.wav`,
}));

// All-obstruent 3-C codas: {k,s,t} → ekst/ekts/eskt; {s,p,t} → espt/epts/epst
export const VCCC_ITEMS = ['ekst', 'ekts', 'eskt', 'espt', 'epts', 'epst'].map(id => ({
  id, foil: null, condition: 'VCCC', onset_n: 0, coda_n: 3,
  audio: `${BASE}stimuli/${id}.wav`,
}));

// ── LexTALE (Lemhöfer & Broersma 2012) ────────────────────────────────────
// Official English item list extracted from LexTALE_Praat_en.zip (lextale.com).
// 60 test items: 40 real words + 20 nonwords. British spelling (savoury, etc.).
// Practice items (platery/denial/generic) shown separately before the test.
export const LEXTALE_PRACTICE = [
  { w: 'PLATERY',  real: false },  // practice nonword
  { w: 'DENIAL',   real: true  },  // practice real word
  { w: 'GENERIC',  real: true  },  // practice real word
];

export const LEXTALE = [
  // Real words (40) — items 2–60 where correct=1
  { w: 'SCORNFUL',     real: true  }, { w: 'STOUTLY',      real: true  },
  { w: 'ABLAZE',       real: true  }, { w: 'MOONLIT',      real: true  },
  { w: 'LOFTY',        real: true  }, { w: 'HURRICANE',    real: true  },
  { w: 'FLAW',         real: true  }, { w: 'UNKEMPT',      real: true  },
  { w: 'BREEDING',     real: true  }, { w: 'FESTIVITY',    real: true  },
  { w: 'SCREECH',      real: true  }, { w: 'SAVOURY',      real: true  },
  { w: 'SHIN',         real: true  }, { w: 'FLUID',        real: true  },
  { w: 'ALLIED',       real: true  }, { w: 'SLAIN',        real: true  },
  { w: 'RECIPIENT',    real: true  }, { w: 'ELOQUENCE',    real: true  },
  { w: 'CLEANLINESS',  real: true  }, { w: 'DISPATCH',     real: true  },
  { w: 'INGENIOUS',    real: true  }, { w: 'BEWITCH',      real: true  },
  { w: 'PLAINTIVELY',  real: true  }, { w: 'HASTY',        real: true  },
  { w: 'LENGTHY',      real: true  }, { w: 'FRAY',         real: true  },
  { w: 'UPKEEP',       real: true  }, { w: 'MAJESTIC',     real: true  },
  { w: 'NOURISHMENT',  real: true  }, { w: 'TURMOIL',      real: true  },
  { w: 'CARBOHYDRATE', real: true  }, { w: 'SCHOLAR',      real: true  },
  { w: 'TURTLE',       real: true  }, { w: 'CYLINDER',     real: true  },
  { w: 'CENSORSHIP',   real: true  }, { w: 'CELESTIAL',    real: true  },
  { w: 'RASCAL',       real: true  }, { w: 'MUDDY',        real: true  },
  { w: 'LISTLESS',     real: true  }, { w: 'WROUGHT',      real: true  },
  // Nonwords (20) — items where correct=0
  { w: 'MENSIBLE',     real: false }, { w: 'KERMSHAW',     real: false },
  { w: 'ALBERATION',   real: false }, { w: 'PLAUDATE',     real: false },
  { w: 'SPAUNCH',      real: false }, { w: 'EXPRATE',      real: false },
  { w: 'REBONDICATE',  real: false }, { w: 'SKAVE',        real: false },
  { w: 'KILP',         real: false }, { w: 'INTERFATE',    real: false },
  { w: 'CRUMPER',      real: false }, { w: 'MAGRITY',      real: false },
  { w: 'ABERGY',       real: false }, { w: 'PROOM',        real: false },
  { w: 'FELLICK',      real: false }, { w: 'DESTRIPTION',  real: false },
  { w: 'PURRAGE',      real: false }, { w: 'PULSH',        real: false },
  { w: 'QUIRTY',       real: false }, { w: 'PUDOUR',       real: false },
];
