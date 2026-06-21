export const meta = {
  name: 'wortkrieg-dedup-regen',
  description: 'Regenerate duplicate-headword slots as unique, theme-fit words (one agent per affected unit)',
  phases: [{ title: 'Regen', detail: 'one agent per affected unit replaces its duplicate slots' }],
}

const A = typeof args === 'string' ? JSON.parse(args) : args
const UNITS = A.units
const BLOCK_TXT = A.blocklist.join(', ')

const REPL_ITEM = {
  type: 'object',
  required: ['id', 'german', 'turkish', 'example', 'exampleTranslation', 'level'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', description: 'The slot id being replaced (must match one of the given slot ids).' },
    german: { type: 'string', description: 'New headword. Nouns MUST include der/die/das. Verbs infinitive.' },
    turkish: { type: 'string' },
    example: { type: 'string', description: 'Short natural German sentence using the new headword; ends with . ! or ?' },
    exampleTranslation: { type: 'string' },
    synonyms: { type: 'array', items: { type: 'string' } },
    level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
  },
}

function prompt(u) {
  const slots = u.replaceSlots
  const slotLines = slots.map((s) => `  - id ${s.id}: "${s.oldGerman}" değiştirilecek (seviye ${s.level})`).join('\n')
  const themeLine = u.theme ? `TEMA: ${u.theme}` : `(Bu ünitenin temasını başlığından çıkar.)`
  return `Sen anadili Almanca olan, Türk öğrencilere Almanca öğreten deneyimli bir öğretmensin. Bir ünitede bazı kelimeler BAŞKA ünitelerde de geçtiği için (tekrar) onları BENZERSİZ yenileriyle değiştiriyorsun.

ÜNİTE: "${u.title}" (Kategori ${u.categoryId})
${themeLine}

DEĞİŞTİRİLECEK ${slots.length} KELİME (her biri için yeni, benzersiz bir kelime üret):
${slotLines}

Bu ünitede KALAN kelimeler (bunlarla ÇAKIŞMA):
${u.keepWords.join(', ')}

GLOBAL YASAK LİSTE — şu kelimeler uygulamada zaten var, KULLANMA (başsözcük olarak):
${BLOCK_TXT}

KURALLAR:
- Her değiştirilecek slot için, AYNI seviyede (slot'ta belirtilen) ve üniteye/temaya uygun YENİ ve BENZERSİZ bir Almanca kelime üret.
- Yeni kelimeler: yukarıdaki yasak listede OLMAYACAK, ünitenin kalan kelimeleriyle ve birbirleriyle çakışMAYACAK.
- İSİMLERDE artikel (der/die/das) ekle ve cinsiyeti DOĞRU ver. Fiiller mastar, sıfatlar yalın.
- example: yeni başsözcüğü içeren kısa, doğal, DOĞRU bir Almanca cümle (., ! veya ? ile biter).
- turkish: doğru Türkçe karşılık. synonyms: 0-3 (başsözcük kendisi olamaz).
- Her replacement nesnesinde "id" alanı, değiştirdiğin slot'un id'si OLMALI. Tam ${slots.length} adet replacement döndür.

Çıktıyı StructuredOutput ile { replacements: [...] } olarak ver.`
}

phase('Regen')
const results = await parallel(
  UNITS.map((u) => () =>
    agent(prompt(u), {
      label: `regen:u${u.unitId} ${u.title} (${u.replaceSlots.length})`,
      phase: 'Regen',
      schema: { type: 'object', required: ['replacements'], additionalProperties: false, properties: { replacements: { type: 'array', items: REPL_ITEM } } },
    }).then((r) => (r?.replacements ? { unitId: u.unitId, replacements: r.replacements } : null))
  )
)

const ok = results.filter(Boolean)
const repairs = ok.flatMap((r) => r.replacements)
log(`Regenerated ${ok.length}/${UNITS.length} units, ${repairs.length} replacement words`)
return { units: [], repairs }
