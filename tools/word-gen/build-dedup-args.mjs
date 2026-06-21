// After generation, find remaining duplicate headwords across the WHOLE corpus and build a
// repair payload to regenerate the later occurrences. Used for dedup rounds until clean.
//   node tools/word-gen/build-dedup-args.mjs > /tmp/dedup_args.json
// Output: { units: [], repairs: [ {id, categoryId, unitId, unitTitle, level, replaces, siblingWords} ], blocklist:[...] }

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpus } from './lib/load.mjs';
import { normalizeHeadword, findDuplicates } from './lib/schema.mjs';

const { words, units } = loadCorpus();
const unitById = new Map(units.map((u) => [u.id, u]));
const wordsByUnit = new Map();
for (const w of words) {
  if (!wordsByUnit.has(w.unitId)) wordsByUnit.set(w.unitId, []);
  wordsByUnit.get(w.unitId).push(w);
}

const dups = findDuplicates(words);
const repairs = dups.map((w) => ({
  id: w.id,
  categoryId: w.categoryId,
  unitId: w.unitId,
  unitTitle: unitById.get(w.unitId)?.title ?? null,
  level: w.level,
  replaces: w.german,
  reason: `duplicate of id ${w.duplicateOf}`,
  siblingWords: (wordsByUnit.get(w.unitId) || []).filter((x) => x.id !== w.id).map((x) => x.german),
}));

// Blocklist excludes the slots being replaced (they free up).
const replacedIds = new Set(dups.map((w) => w.id));
const blocklist = [...new Set(
  words.filter((w) => !replacedIds.has(w.id)).map((w) => normalizeHeadword(w.german))
)].sort();

process.stdout.write(JSON.stringify({ units: [], repairs, blocklist }));
process.stderr.write(`dups=${repairs.length} blocklist=${blocklist.length}\n`);
