// Applies Phase-3 generation results to the unit files.
//   node tools/word-gen/apply-gen.mjs <results.json>
//
// results.json shape:
//   { units:   [ { unitId, words: [15 linguistic word objects] } ],
//     repairs: [ { id, german, turkish, example, exampleTranslation, synonyms, level } ] }
//
// New units -> units/gen-c<cat>-u<unitId>.json (ids stamped from firstWordId at load time).
// Repairs   -> replace the matching word (by id) in its existing seed unit file, in place.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNITS_DIR } from './lib/load.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = process.argv[2];
if (!resultsPath) { console.error('usage: apply-gen.mjs <results.json>'); process.exit(1); }

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const cur = JSON.parse(fs.readFileSync(path.join(__dirname, 'curriculum.json'), 'utf8'));
const unitMeta = new Map(cur.units.map((u) => [u.id, u]));

const LING = ['german', 'turkish', 'example', 'exampleTranslation', 'synonyms', 'level'];
const pick = (w) => {
  const o = {};
  for (const k of LING) if (w[k] !== undefined) o[k] = w[k];
  if (!Array.isArray(o.synonyms)) o.synonyms = [];
  return o;
};

// 1) New generated units.
let unitsWritten = 0;
for (const u of results.units || []) {
  const meta = unitMeta.get(u.unitId);
  if (!meta) { console.warn(`⚠️  unknown unitId ${u.unitId}, skipping`); continue; }
  const file = `gen-c${meta.categoryId}-u${String(u.unitId).padStart(3, '0')}.json`;
  const payload = {
    kind: 'gen',
    unitId: u.unitId,
    categoryId: meta.categoryId,
    number: meta.number,
    title: meta.title,
    theme: meta.theme,
    firstWordId: meta.firstWordId,
    words: (u.words || []).map(pick),
  };
  fs.writeFileSync(path.join(UNITS_DIR, file), JSON.stringify(payload, null, 2) + '\n');
  unitsWritten++;
}

// 2) Repairs: find the file holding each id, replace that word object in place.
let repaired = 0;
if (results.repairs && results.repairs.length) {
  const files = fs.readdirSync(UNITS_DIR).filter((f) => f.endsWith('.json'));
  const byId = new Map(results.repairs.map((r) => [r.id, r]));
  for (const file of files) {
    const p = path.join(UNITS_DIR, file);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    let touched = false;
    for (let i = 0; i < (data.words || []).length; i++) {
      const w = data.words[i];
      // Seed files store explicit ids; gen files stamp id = firstWordId + index at load time.
      const effId = w.id != null ? w.id : (data.firstWordId != null ? data.firstWordId + i : undefined);
      if (effId != null && byId.has(effId)) {
        const r = byId.get(effId);
        // Preserve the file's word shape: seed words keep id/categoryId/unitId; gen words stay
        // bare (positional id). This keeps the positional id stable.
        data.words[i] = w.id != null
          ? { id: w.id, categoryId: w.categoryId, unitId: w.unitId, ...pick(r) }
          : pick(r);
        byId.delete(effId);
        touched = true;
        repaired++;
      }
    }
    if (touched) fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  }
  if (byId.size) console.warn(`⚠️  ${byId.size} repair ids not found: ${[...byId.keys()].join(', ')}`);
}

console.log(`Wrote ${unitsWritten} generated unit file(s), applied ${repaired} repair(s).`);
