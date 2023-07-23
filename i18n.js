/*
# Licensed to the egb38 under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  egb38 licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   https://github.com/egb38/armalogs/blob/main/LICENSE
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
*/

// inspired from https://phrase.com/blog/posts/step-step-guide-javascript-localization/

// defaults to French
var currentLocale = "fr";
const supportedLocales = ["en", "fr"];

var allTranslations = [];

// The active locale
let locale;

// Gets filled with active locale translations
let translations = {};

// When the page content is ready...
document.addEventListener("DOMContentLoaded", () => {

  // is there a saved locale in local storage?
  var savedLocale = localStorage.getItem("locale");
  if (savedLocale!=undefined && savedLocale!=null 
      && supportedLocales.includes(savedLocale) && savedLocale!=currentLocale) {
    // change current locale to teh saved value
    currentLocale = savedLocale;
  }
    // Translate the page to the current locale
    setLocale(currentLocale);


  // locale change handling
  bindLocaleSwitcher(currentLocale);

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
  localStorage.setItem("locale", locale);
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

