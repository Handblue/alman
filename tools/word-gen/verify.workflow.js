export const meta = {
  name: 'wortkrieg-quality-verify',
  description: 'Native-proofread each generated unit: fix gender/spelling/translation/example/level in place',
  phases: [{ title: 'Verify', detail: 'one proofreader agent per unit' }],
}

const A = typeof args === 'string' ? JSON.parse(args) : args
const UNITS = A.units

const WORD_ITEM = {
  type: 'object',
  required: ['german', 'turkish', 'example', 'exampleTranslation', 'level'],
  additionalProperties: false,
  properties: {
    german: { type: 'string' },
    turkish: { type: 'string' },
    example: { type: 'string' },
    exampleTranslation: { type: 'string' },
    synonyms: { type: 'array', items: { type: 'string' } },
    level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
  },
}

function prompt(u) {
  return `Sen titiz, anadili Almanca bir düzeltmen/Lektor'sun. Aşağıdaki ${u.words.length} kelimelik liste "${u.title}" ünitesi için üretildi${u.theme ? ` (tema: ${u.theme})` : ''}. Her kelimeyi TEK TEK denetle ve DÜZELTİLMİŞ listeyi aynı sırada döndür.

DENETLE ve gerekiyorsa DÜZELT:
1. Artikel/cinsiyet (der/die/das) Duden'e göre DOĞRU mu? — En kritik ve en sık hatadır.
2. Yazım: ß, ä/ö/ü, isimler büyük harf.
3. Türkçe karşılık doğru ve net mi?
4. Örnek cümle dilbilgisel DOĞRU ve DOĞAL mı? Başsözcüğü içeriyor mu? Çevirisi doğru mu?
5. Seviye (level) makul mü?
6. Eşanlamlılar doğru mu, başsözcüğün kendisi verilmiş mi (verilmişse çıkar)?

ÇOK ÖNEMLİ: Başsözcükleri (german) MÜMKÜN OLDUĞUNCA KORU. Bir kelime tamamen yanlışsa düzelt;
ama doğru bir kelimeyi gereksiz yere DEĞİŞTİRME (yeni tekrarlara yol açmamak için). Yalnızca
artikel/yazım/çeviri/örnek hatalarını düzeltmen genelde yeterli.

Liste tam ${u.words.length} kelime kalmalı, aynı sırada.

MEVCUT LİSTE (JSON):
${JSON.stringify(u.words)}

Düzeltilmiş listeyi StructuredOutput ile { unitId: ${u.unitId}, words: [...] } olarak ver.`
}

phase('Verify')
const results = await parallel(
  UNITS.map((u) => () =>
    agent(prompt(u), {
      label: `verify:u${u.unitId} ${u.title}`,
      phase: 'Verify',
      schema: { type: 'object', required: ['unitId', 'words'], additionalProperties: false, properties: { unitId: { type: 'integer' }, words: { type: 'array', items: WORD_ITEM } } },
    }).then((v) => (v?.words && v.words.length === u.words.length ? { unitId: u.unitId, words: v.words } : null))
  )
)

const ok = results.filter(Boolean)
log(`Verified ${ok.length}/${UNITS.length} units`)
return { units: ok, repairs: [] }
