// Loads all per-unit JSON files into a resolved corpus { words, units }.
// Each word gets a stable id / categoryId / unitId stamped from its unit, so generated
// unit files only need to carry the linguistic fields (id assigned deterministically).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UNITS_DIR = path.join(__dirname, '..', 'units');

export function loadCorpus() {
  const files = fs.readdirSync(UNITS_DIR).filter((f) => f.endsWith('.json')).sort();
  const words = [];
  const units = [];

  for (const file of files) {
    const u = JSON.parse(fs.readFileSync(path.join(UNITS_DIR, file), 'utf8'));
    if (u.unitId == null || u.categoryId == null) {
      throw new Error(`${file}: missing unitId/categoryId`);
    }
    const unitWords = (u.words || []).map((w, i) => {
      const { id, categoryId, unitId, ...rest } = w;
      const resolved = {
        id: id ?? (u.firstWordId != null ? u.firstWordId + i : undefined),
        categoryId: u.categoryId,
        unitId: u.unitId,
        ...rest,
      };
      if (resolved.id == null) throw new Error(`${file}: word #${i} has no id and unit has no firstWordId`);
      return resolved;
    });
    words.push(...unitWords);
    units.push({
      id: u.unitId,
      categoryId: u.categoryId,
      number: u.number,
      title: u.title,
      wordCount: unitWords.length,
      _file: file,
    });
  }

  words.sort((a, b) => a.id - b.id);
  units.sort((a, b) => a.categoryId - b.categoryId || a.number - b.number);
  return { words, units };
}
