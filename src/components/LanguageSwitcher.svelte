<script lang="ts">
  import { locale } from '../lib/i18n'

  const languages = [
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' }
  ]

  let isOpen = $state(false)
  let currentLocale = $state('en-US')

  // Subscribe to locale changes
  $effect(() => {
    const unsubscribe = locale.subscribe(value => {
      if (value) {
        currentLocale = value
      }
    })
    return unsubscribe
  })

  function getCurrentLanguage() {
    return languages.find(l => l.code === currentLocale) || languages[0]
  }

  function selectLanguage(code: string) {
    locale.set(code)
    isOpen = false
  }

  function toggleDropdown() {
    isOpen = !isOpen
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.language-switcher')) {
      isOpen = false
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<div class="relative language-switcher">
  <button
    onclick={toggleDropdown}
    class="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-2"
    aria-label="Select language"
  >
    <span class="text-lg">{getCurrentLanguage().flag}</span>
    <span class="hidden sm:inline">{getCurrentLanguage().label}</span>
    <svg
      class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
      {#each languages as language (language.code)}
        <button
          onclick={() => selectLanguage(language.code)}
          class="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition flex items-center gap-3 {currentLocale === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}"
        >
          <span class="text-lg">{language.flag}</span>
          <span>{language.label}</span>
          {#if currentLocale === language.code}
            <svg class="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
