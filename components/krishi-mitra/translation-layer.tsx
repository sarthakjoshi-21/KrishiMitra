'use client'

/**
 * TranslationLayer — NEUTRALIZED.
 *
 * The previous implementation used a DOM TreeWalker + string `.replace()` to
 * rewrite text nodes after render. This caused partial-word glitches such as
 * "Farmers Welfare" → "शेतकरीs Welfare" because "Farmer" was matched and
 * replaced inside "Farmers".
 *
 * Translation is now handled entirely at the component level via the
 * `t(key, language)` helper from `lib/translations.ts` and the `useLanguage()`
 * hook. This component is intentionally left as a no-op so that the layout
 * import continues to compile without changes.
 */
export function TranslationLayer() {
  return null
}
