import { createI18n } from 'vue-i18n'
import en from './en'
import zh from './zh'

const messages = {
  en,
  zh
}

const i18n = createI18n({
  legacy: false,
  locale: navigator.language.startsWith('zh') ? 'zh' : 'en',
  fallbackLocale: 'en',
  messages
})

export default i18n