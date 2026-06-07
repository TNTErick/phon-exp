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
// 40 real words + 20 nonwords. Verify against lextale.com before publishing.
export const LEXTALE = [
  { w: 'BLOND',    real: true  }, { w: 'FRISK',    real: true  },
  { w: 'STAVE',    real: true  }, { w: 'DAINTY',   real: true  },
  { w: 'FINESSE',  real: true  }, { w: 'LOCKET',   real: true  },
  { w: 'TRICE',    real: true  }, { w: 'WAIF',     real: true  },
  { w: 'DUNCE',    real: true  }, { w: 'NADIR',    real: true  },
  { w: 'ABLAZE',   real: true  }, { w: 'CRAVEN',   real: true  },
  { w: 'GIMLET',   real: true  }, { w: 'SQUALOR',  real: true  },
  { w: 'STAID',    real: true  }, { w: 'WINNOW',   real: true  },
  { w: 'CLOISTER', real: true  }, { w: 'FRUGAL',   real: true  },
  { w: 'HAPLESS',  real: true  }, { w: 'IMPASSE',  real: true  },
  { w: 'JOCUND',   real: true  }, { w: 'LEEWAY',   real: true  },
  { w: 'MAUDLIN',  real: true  }, { w: 'NETTLE',   real: true  },
  { w: 'OSPREY',   real: true  }, { w: 'PEWTER',   real: true  },
  { w: 'QUAVER',   real: true  }, { w: 'GAUNT',    real: true  },
  { w: 'DREGS',    real: true  }, { w: 'SKULK',    real: true  },
  { w: 'WRATH',    real: true  }, { w: 'QUALM',    real: true  },
  { w: 'BROOD',    real: true  }, { w: 'GLOAT',    real: true  },
  { w: 'MELEE',    real: true  }, { w: 'POUNCE',   real: true  },
  { w: 'SLUR',     real: true  }, { w: 'CHORD',    real: true  },
  { w: 'BATHE',    real: true  }, { w: 'GROAT',    real: true  },
  { w: 'STEVEL',   real: false }, { w: 'FREUND',   real: false },
  { w: 'GRAITH',   real: false }, { w: 'SLERB',    real: false },
  { w: 'FRALT',    real: false }, { w: 'TWEAL',    real: false },
  { w: 'PREND',    real: false }, { w: 'BLAVE',    real: false },
  { w: 'GREEL',    real: false }, { w: 'SMIRN',    real: false },
  { w: 'FROWL',    real: false }, { w: 'TRISP',    real: false },
  { w: 'BLEMP',    real: false }, { w: 'SNORF',    real: false },
  { w: 'GRULP',    real: false }, { w: 'THRENK',   real: false },
  { w: 'SWEAL',    real: false }, { w: 'PRINK',    real: false },
  { w: 'CHULM',    real: false }, { w: 'VOISE',    real: false },
];
