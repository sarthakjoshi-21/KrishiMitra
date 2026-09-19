/**
 * lib/bhashini.ts
 *
 * Thin client-side helper for the Bhashini NMT (text translation) endpoint.
 * Calls the project's own /api/bhashini Next.js route — credentials stay server-side.
 *
 * Usage:
 *   import { translateTextsBhashini } from '@/lib/bhashini'
 *   const translated = await translateTextsBhashini(['Wheat', 'Onion'], 'mr')
 *   // => ['गहू', 'कांदा']
 */

export type BhashiniLang = 'en' | 'hi' | 'mr'

/**
 * Translate a batch of English strings into targetLang via Bhashini NMT.
 * Returns the input array unchanged if:
 *  - targetLang is 'en'
 *  - the API call fails for any reason (graceful degradation)
 *
 * @param texts      Array of English strings to translate
 * @param targetLang ISO-639-1 language code ('hi' | 'mr')
 * @returns          Array of translated strings, same length and order as texts
 */
export async function translateTextsBhashini(
  texts: string[],
  targetLang: BhashiniLang
): Promise<string[]> {
  if (!texts.length) return []
  if (targetLang === 'en') return texts // no-op

  try {
    const res = await fetch('/api/bhashini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'translate',
        language: targetLang,
        texts,
      }),
    })

    if (!res.ok) {
      console.warn('[bhashini] translate HTTP', res.status)
      return texts // graceful fallback
    }

    const data = await res.json()
    if (Array.isArray(data.translations) && data.translations.length === texts.length) {
      return data.translations as string[]
    }

    console.warn('[bhashini] unexpected response shape:', data)
    return texts
  } catch (err) {
    console.warn('[bhashini] translateTextsBhashini failed, falling back to English:', err)
    return texts
  }
}

/**
 * Translate a single English string via Bhashini NMT.
 * Wrapper around translateTextsBhashini for convenience.
 */
export async function translateTextBhashini(
  text: string,
  targetLang: BhashiniLang,
  sourceLang: BhashiniLang = 'en'
): Promise<string> {
  if (sourceLang !== 'en' || targetLang === 'en') return text
  const results = await translateTextsBhashini([text], targetLang)
  return results[0] ?? text
}
