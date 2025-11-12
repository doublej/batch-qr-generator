import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n'

import enUS from './en_US.json'
import de from './de.json'
import nl from './nl.json'
import fr from './fr.json'

// Add all translations
addMessages('en-US', enUS)
addMessages('en', enUS) // Fallback for 'en'
addMessages('de', de)
addMessages('de-DE', de)
addMessages('nl', nl)
addMessages('nl-NL', nl)
addMessages('fr', fr)
addMessages('fr-FR', fr)

// Initialize i18n
export function initI18n() {
  init({
    fallbackLocale: 'en-US',
    initialLocale: getLocaleFromNavigator()
  })
}

// Export commonly used functions for convenience
export { _, locale, locales } from 'svelte-i18n'
