import en from './en.json';
import hi from './hi.json';

const dict = { en, hi };
const KEY = 'lang';

export function getLang() {
  return localStorage.getItem(KEY) || 'en';
}

export function setLang(lang) {
  localStorage.setItem(KEY, lang);
}

export function t(key, lang = getLang()) {
  return dict[lang]?.[key] ?? dict.en[key] ?? key;
}

