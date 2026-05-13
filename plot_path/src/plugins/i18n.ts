import { createI18n } from 'vue-i18n'
import en from '@/i18n/en'
import uk from '@/i18n/uk'

const savedLocale = (localStorage.getItem('locale') as 'en' | 'uk') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, uk },
})

export default i18n
