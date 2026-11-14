import en from '../i18n/en.json'
import uk from '../i18n/uk.json'
import zh from '../i18n/zh-CN.json'
import type { Locale } from './save'

export type Dictionary = Record<string, string>
const DICTIONARIES: Record<Locale, Dictionary> = { uk, en, 'zh-CN': zh }

/** Arena Lab is pinned to Ukrainian; legacy locales remain readable in old saves. */
export function detectLocale(languages: readonly string[] | undefined): Locale {
  void languages
  return 'uk'
}

/** A saved player choice always wins over browser detection. */
export function resolveLocale(saved: Locale | '', languages: readonly string[] | undefined): Locale {
  return saved === 'uk' || saved === 'en' || saved === 'zh-CN' ? saved : detectLocale(languages)
}

export class I18n {
  locale: Locale
  private listeners = new Set<(locale: Locale) => void>()

  constructor(locale: Locale) {
    this.locale = locale
    document.documentElement.lang = locale
  }

  /** Look up `key`, replacing `{name}` placeholders. Missing keys render the key so gaps are visible. */
  t(key: string, vars: Record<string, string | number> = {}): string {
    const text = DICTIONARIES[this.locale][key] ?? DICTIONARIES.en[key] ?? key
    return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
  }

  set(locale: Locale): void {
    if (locale === this.locale) return
    this.locale = locale
    document.documentElement.lang = locale
    for (const fn of this.listeners) fn(locale)
  }

  onChange(fn: (locale: Locale) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

export const DICTIONARY_KEYS = { en: Object.keys(en), zh: Object.keys(zh) }
