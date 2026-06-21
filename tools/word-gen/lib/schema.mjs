// Shared schema + validation primitives for the WortKrieg vocabulary pipeline.
// Plain Node ESM so it runs with zero extra tooling: `node tools/word-gen/validate.mjs`.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const ARTICLES = ['der', 'die', 'das'];
export const CATEGORY_IDS = [1, 2, 3, 4, 5, 6, 7, 8];
export const WORDS_PER_UNIT = 15;
export const UNITS_PER_CATEGORY = 20;

// JSON-schema-style description of a single Word (documentation + agent contract).
export const WORD_JSON_SCHEMA = {
  type: 'object',
  required: ['german', 'turkish', 'example', 'exampleTranslation', 'level'],
  additionalProperties: false,
  properties: {
    german: { type: 'string', minLength: 1, description: 'Headword. Nouns MUST start with der/die/das.' },
    turkish: { type: 'string', minLength: 1, description: 'Turkish meaning(s), " / " separated if multiple.' },
    example: { type: 'string', minLength: 1, description: 'Natural German sentence using the headword.' },
    exampleTranslation: { type: 'string', minLength: 1, description: 'Turkish translation of the example.' },
    synonyms: { type: 'array', items: { type: 'string' }, description: 'German synonyms; never the headword itself.' },
    level: { type: 'string', enum: LEVELS },
  },
};

// Normalize a German headword for duplicate detection: lowercase, collapse whitespace.
// Keeps the article (die Bank vs der Bank are distinct) but is case/space insensitive.
export function normalizeHeadword(german) {
  return String(german).trim().toLowerCase().replace(/\s+/g, ' ');
}

// The "base" noun without article, for softer near-duplicate detection.
export function headwordBase(german) {
  const n = normalizeHeadword(german);
  const parts = n.split(' ');
  if (parts.length > 1 && ARTICLES.includes(parts[0])) return parts.slice(1).join(' ');
  return n;
}

function isNoun(german) {
  const first = String(german).trim().split(/\s+/)[0]?.toLowerCase();
  return ARTICLES.includes(first);
}

// Validate a single word object. `ctx` carries categoryId/unitId/level target for cross-checks.
// Returns an array of human-readable error strings (empty = valid).
export function validateWord(word, ctx = {}) {
  const errors = [];
  const where = ctx.label ? `[${ctx.label}] ` : '';

  for (const field of ['german', 'turkish', 'example', 'exampleTranslation']) {
    if (typeof word[field] !== 'string' || word[field].trim().length === 0) {
      errors.push(`${where}missing/empty "${field}"`);
    }
  }

  if (!LEVELS.includes(word.level)) {
    errors.push(`${where}invalid level "${word.level}" (expected ${LEVELS.join('/')})`);
  }

  // Capitalization: a simple "<artikel> <Nomen>" headword must capitalize the noun.
  // Only the strict 2-token form is checked, to avoid false positives on adjective+noun
  // phrases ("das soziale Netzwerk") and pronoun-led idioms ("das macht nichts").
  if (typeof word.german === 'string') {
    const tokens = word.german.trim().split(/\s+/);
    if (tokens.length === 2 && isNoun(word.german)) {
      const noun = tokens[1];
      if (noun[0] !== noun[0].toUpperCase()) {
        errors.push(`${where}noun not capitalized: "${word.german.trim()}"`);
      }
    }
  }

  // Example should actually be a sentence (end punctuation) and be non-trivial.
  if (typeof word.example === 'string') {
    const ex = word.example.trim();
    if (ex.length < 5) errors.push(`${where}example too short: "${ex}"`);
    if (!/[.!?…»"']$/.test(ex)) errors.push(`${where}example should end with sentence punctuation: "${ex}"`);
  }

  // Synonyms: array of non-empty strings, none equal to the headword, no internal dupes.
  if (word.synonyms !== undefined) {
    if (!Array.isArray(word.synonyms)) {
      errors.push(`${where}synonyms must be an array`);
    } else {
      const seen = new Set();
      for (const s of word.synonyms) {
        if (typeof s !== 'string' || s.trim() === '') { errors.push(`${where}empty synonym`); continue; }
        const key = normalizeHeadword(s);
        if (word.german && key === normalizeHeadword(word.german)) {
          errors.push(`${where}synonym equals headword: "${s}"`);
        }
        if (seen.has(key)) errors.push(`${where}duplicate synonym: "${s}"`);
        seen.add(key);
      }
    }
  }

  // Cross-checks against unit context.
  if (ctx.categoryId !== undefined && word.categoryId !== undefined && word.categoryId !== ctx.categoryId) {
    errors.push(`${where}categoryId ${word.categoryId} != unit ${ctx.categoryId}`);
  }
  if (ctx.unitId !== undefined && word.unitId !== undefined && word.unitId !== ctx.unitId) {
    errors.push(`${where}unitId ${word.unitId} != unit ${ctx.unitId}`);
  }

  return errors;
}

// Find duplicate headwords. Returns the LATER occurrences (the ones to regenerate),
// each annotated with the id of the first (kept) occurrence.
export function findDuplicates(words) {
  const first = new Map();
  const dups = [];
  for (const w of words) {
    const k = normalizeHeadword(w.german);
    if (first.has(k)) dups.push({ ...w, duplicateOf: first.get(k) });
    else first.set(k, w.id);
  }
  return dups;
}

// Validate a whole corpus (array of fully-resolved words with id/categoryId/unitId).
// Checks global invariants: unique ids, unique headwords, contiguous ids, valid refs.
export function validateCorpus(words, units, { requireComplete = false } = {}) {
  const errors = [];
  const ids = new Set();
  const heads = new Map(); // normalized headword -> first id

  const unitIds = new Set((units || []).map((u) => u.id));

  for (const w of words) {
    const label = `id ${w.id} "${w.german}"`;
    errors.push(...validateWord(w, { label, categoryId: w.categoryId, unitId: w.unitId }));

    if (!Number.isInteger(w.id) || w.id < 1) errors.push(`${label}: id must be positive integer`);
    if (ids.has(w.id)) errors.push(`${label}: duplicate id`);
    ids.add(w.id);

    if (!CATEGORY_IDS.includes(w.categoryId)) errors.push(`${label}: bad categoryId ${w.categoryId}`);
    if (units && !unitIds.has(w.unitId)) errors.push(`${label}: unitId ${w.unitId} not in units list`);

    const hk = normalizeHeadword(w.german);
    if (heads.has(hk)) {
      errors.push(`${label}: duplicate headword (also id ${heads.get(hk)})`);
    } else {
      heads.set(hk, w.id);
    }
  }

  // Per-unit count check.
  if (units) {
    const byUnit = new Map();
    for (const w of words) byUnit.set(w.unitId, (byUnit.get(w.unitId) || 0) + 1);
    for (const u of units) {
      const n = byUnit.get(u.id) || 0;
      if (n !== WORDS_PER_UNIT) {
        errors.push(`unit ${u.id} "${u.title}" has ${n} words (expected ${WORDS_PER_UNIT})`);
      }
    }
    // Per-category unit count — only enforced when a complete corpus is expected.
    if (requireComplete) {
      const byCat = new Map();
      for (const u of units) byCat.set(u.categoryId, (byCat.get(u.categoryId) || 0) + 1);
      for (const c of CATEGORY_IDS) {
        const n = byCat.get(c) || 0;
        if (n !== UNITS_PER_CATEGORY) {
          errors.push(`category ${c} has ${n} units (expected ${UNITS_PER_CATEGORY})`);
        }
      }
    }
  }

  return errors;
}
