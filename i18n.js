// originally copied from https://phrase.com/blog/posts/step-step-guide-javascript-localization/
const defaultLocale = "fr";
var currentLocale = defaultLocale;
const supportedLocales = ["en", "fr"];

var allTranslations = [];

// The active locale
let locale;

// Gets filled with active locale translations
let translations = {};

// When the page content is ready...
document.addEventListener("DOMContentLoaded", () => {

  // Translate the page to the default locale
  setLocale(defaultLocale);

  // locale change handling
  bindLocaleSwitcher(defaultLocale);

  // load all translations
  loadAllTranslations();
});

// Load translations for the given locale and translate
// the page to this locale
async function setLocale(newLocale) {

  if (newLocale === locale) return;
  const newTranslations =
    await fetchTranslationsFor(newLocale);
  locale = newLocale;
  translations = newTranslations;
  translatePage();
}

// Whenever the user selects a new locale, we
// load the locale's translations and update
// the page
function bindLocaleSwitcher(initialValue) {
    const switcher =
      document.querySelector("[data-i18n-switcher]");
    switcher.value = initialValue;
    switcher.onchange = (e) => {
      // Set the locale to the selected option[value]
      setLocale(e.target.value);
    };
}

// Retrieve translations JSON object for the given
// locale over the network
async function fetchTranslationsFor(newLocale) {
  const response = await fetch(`/lang/${newLocale}.json`);
  return await response.json();
}

// Replace the inner text of each element that has a
// data-i18n-key attribute with the translation corresponding
// to its data-i18n-key
function translatePage() {
  document
    .querySelectorAll("[data-i18n-key]")
    .forEach(translateElement);
}

// Replace the inner text of the given HTML element
// with the translation in the active locale,
// corresponding to the element's data-i18n-key
function translateElement(element) {
  const key = element.getAttribute("data-i18n-key");
  var translation = translations[key];
  if (translation==undefined) {
    translation = allTranslations['en'][key];
  }
  element.innerText = translation;
}

// get translated string for dynamically generated content
function getI18nContent(key) {
    var t = translations[key];
    if (t==undefined) {
        t = allTranslations['en'][key];
    }
    return t;
}

// return all translations as an array
// used to check some values in the log files
// across all languages
function getStringAllLocales(key) {
    string = [];
    supportedLocales.forEach(function(l) {
        string.push(allTranslations[l][key]);
    });
    return string;
}

// loads all translations / locales
async function loadAllTranslations() { 
    for (const l of supportedLocales) {
        const newTranslations =
            await fetchTranslationsFor(l);
        allTranslations[l] = newTranslations;
    }
}

