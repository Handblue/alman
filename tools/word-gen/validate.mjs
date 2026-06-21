// Validation gate for the vocabulary corpus.
//
//   node tools/word-gen/validate.mjs            # validate whatever unit files exist
//   node tools/word-gen/validate.mjs --complete # also require 160 units / 20 per category
//
// Exits 1 (and prints errors) if any invariant fails. Used by compile.mjs and CI.

import { loadCorpus } from './lib/load.mjs';
import { validateCorpus, WORDS_PER_UNIT } from './lib/schema.mjs';

const requireComplete = process.argv.includes('--complete');

const { words, units } = loadCorpus();
const errors = validateCorpus(words, units, { requireComplete });

const byLevel = words.reduce((m, w) => ((m[w.level] = (m[w.level] || 0) + 1), m), {});
console.log(`Corpus: ${words.length} words, ${units.length} units.`);
console.log(`Level distribution: ${Object.entries(byLevel).map(([l, n]) => `${l}:${n}`).join('  ')}`);

if (errors.length) {
  console.error(`\n❌ ${errors.length} validation error(s):`);
  for (const e of errors.slice(0, 80)) console.error('  - ' + e);
  if (errors.length > 80) console.error(`  ... and ${errors.length - 80} more`);
  process.exit(1);
}

console.log(`\n✅ Valid. (${words.length / WORDS_PER_UNIT | 0} full units${requireComplete ? ', complete corpus' : ''})`);
