// Deterministic synonym hygiene across all unit files: drop synonyms equal to the headword,
// drop empty synonyms, and de-duplicate the synonym list (case/space-insensitive).
//   node tools/word-gen/clean-synonyms.mjs

import fs from 'node:fs';
import path from 'node:path';
import { UNITS_DIR } from './lib/load.mjs';
import { normalizeHeadword } from './lib/schema.mjs';

const files = fs.readdirSync(UNITS_DIR).filter((f) => f.endsWith('.json'));
let cleaned = 0;
for (const file of files) {
  const p = path.join(UNITS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let touched = false;
  for (const w of data.words || []) {
    if (!Array.isArray(w.synonyms)) continue;
    const hk = normalizeHeadword(w.german);
    const seen = new Set();
    const next = [];
    for (const s of w.synonyms) {
      if (typeof s !== 'string') continue;
      const t = s.trim();
      if (!t) continue;
      const k = normalizeHeadword(t);
      if (k === hk || seen.has(k)) continue;
      seen.add(k);
      next.push(t);
    }
    if (next.length !== w.synonyms.length) { w.synonyms = next; touched = true; cleaned++; }
  }
  if (touched) fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
console.log(`Cleaned synonyms on ${cleaned} word(s).`);
