import type { Locale } from "~/lib/language"
import { dict as en } from "~/i18n/en"
import { dict as es } from "~/i18n/es"
import { dict as br } from "~/i18n/br"

export type Key = keyof typeof en
export type Dict = Record<Key, string>

const base = en satisfies Dict

export function i18n(locale: Locale): Dict {
  if (locale === "en") return base
  if (locale === "es") return { ...base, ...es }
  if (locale === "br") return { ...base, ...br }
  return base
}
