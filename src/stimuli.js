// ── MINIMAL PAIRS ─────────────────────────────────────────────────────────
// 20 CCVC/CVCC pairs, vowel /ɛ/ throughout.
// Same consonants C1+C2+C3, different distribution:
//   CCVC: onset cluster C1C2, single coda C3
//   CVCC: single onset C1, coda cluster C2C3
// All verified English nonwords. C2 = /r/ or /l/ (10 each).

export const PAIRS = [
  // ── original 10 ──
  { ccvc: 'brep', cvcc: 'berp' },   // br / -rp
  { ccvc: 'blef', cvcc: 'belf' },   // bl / -lf
  { ccvc: 'freb', cvcc: 'ferb' },   // fr / -rb
  { ccvc: 'flep', cvcc: 'felp' },   // fl / -lp
  { ccvc: 'greb', cvcc: 'gerb' },   // gr / -rb
  { ccvc: 'glek', cvcc: 'gelk' },   // gl / -lk
  { ccvc: 'krev', cvcc: 'kerv' },   // kr / -rv
  { ccvc: 'klev', cvcc: 'kelv' },   // kl / -lv
  { ccvc: 'trep', cvcc: 'terp' },   // tr / -rp
  { ccvc: 'plev', cvcc: 'pelv' },   // pl / -lv
  // ── new 10 ──
  { ccvc: 'drep', cvcc: 'derp' },   // dr / -rp
  { ccvc: 'dref', cvcc: 'derf' },   // dr / -rf
  { ccvc: 'slek', cvcc: 'selk' },   // sl / -lk
  { ccvc: 'slem', cvcc: 'selm' },   // sl / -lm
  { ccvc: 'plek', cvcc: 'pelk' },   // pl / -lk
  { ccvc: 'preb', cvcc: 'perb' },   // pr / -rb
  { ccvc: 'gref', cvcc: 'gerf' },   // gr / -rf
  { ccvc: 'glem', cvcc: 'gelm' },   // gl / -lm
  { ccvc: 'blek', cvcc: 'belk' },   // bl / -lk
  { ccvc: 'frev', cvcc: 'ferv' },   // fr / -rv
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
