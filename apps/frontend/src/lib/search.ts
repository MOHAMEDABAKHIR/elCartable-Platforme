/**
 * Normalise un texte pour une recherche tolérante : insensible à la casse,
 * aux accents latins (é/è/ê -> e), aux diacritiques arabes (harakat), aux
 * variantes de lettres arabes (أ/إ/آ -> ا, ى -> ي, ة -> ه), à la
 * ponctuation/caractères spéciaux et aux espaces multiples.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    // Diacritiques latins (é -> e, ç -> c, ...)
    .replace(/[\u0300-\u036f]/g, '')
    // Harakat arabes (fatha, damma, kasra, sukun, chadda, tanwin...)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // Alef sous toutes ses formes -> alef nu
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Alef maksoura -> ya
    .replace(/\u0649/g, '\u064A')
    // Ta marbouta -> ha
    .replace(/\u0629/g, '\u0647')
    .toLowerCase()
    // Ponctuation / symboles -> espace (garde lettres et chiffres, tous scripts)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // Espaces multiples -> un seul
    .replace(/\s+/g, ' ')
    .trim();
}

/** Vrai si `text` matche `query` une fois les deux normalisés. Chaîne vide = tout matche. */
export function matchesSearch(text: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return normalizeSearchText(text).includes(normalizedQuery);
}