import en from "./en.json";
import es from "./es.json";
import ru from "./ru.json";

const translations = { en, es, ru };

function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

export function t(key, lang = "en", params = {}) {
  const langData = translations[lang] || translations.en;
  let value = getNested(langData, key) || getNested(translations.en, key) || key;
  if (params && typeof value === "string") {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }
  return value;
}

export { translations };
