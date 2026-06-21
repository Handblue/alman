// Builds the input payload for the Phase-3 generation workflow.
//   node tools/word-gen/build-gen-args.mjs > /tmp/phase3_args.json
//
// Output: { units:[...new units to generate...], repairs:[...duplicate slots to replace...],
//           blocklist:[...all existing unique headwords to avoid...] }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpus } from './lib/load.mjs';
import { normalizeHeadword, findDuplicates } from './lib/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cur = JSON.parse(fs.readFileSync(path.join(__dirname, 'curriculum.json'), 'utf8'));
const repairsList = JSON.parse(fs.readFileSync(path.join(__dirname, 'repairs.json'), 'utf8'));

const { words, units } = loadCorpus();

// New units to generate (planned stubs).
const newUnits = cur.units
  .filter((u) => u.status === 'planned' || u.status === 'stub')
  .map((u) => ({
    unitId: u.id,
    categoryId: u.categoryId,
    number: u.number,
    title: u.title,
    theme: u.theme,
    subtopics: u.subtopics,
    levelProfile: u.levelProfile,
    firstWordId: u.firstWordId,
  }));

// Repair slots: enrich with unit title + sibling headwords (avoid intra-unit dup).
const wordsByUnit = new Map();
for (const w of words) {
  if (!wordsByUnit.has(w.unitId)) wordsByUnit.set(w.unitId, []);
  wordsByUnit.get(w.unitId).push(w);
}
const repairs = repairsList.map((r) => ({
  ...r,
  siblingWords: (wordsByUnit.get(r.unitId) || []).filter((w) => w.id !== r.id).map((w) => w.german),
}));

// Blocklist: every existing unique headword EXCEPT the ones being replaced (those free up).
const replacedIds = new Set(repairsList.map((r) => r.id));
const blocklist = [...new Set(
  words.filter((w) => !replacedIds.has(w.id)).map((w) => normalizeHeadword(w.german))
)].sort();

const payload = { units: newUnits, repairs, blocklist };
process.stdout.write(JSON.stringify(payload));
process.stderr.write(`units=${newUnits.length} repairs=${repairs.length} blocklist=${blocklist.length}\n`);
