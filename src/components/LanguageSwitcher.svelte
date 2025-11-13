<script lang="ts">
  import { locale } from '../lib/i18n'
  import { Button } from '$lib/components/ui/button'

  const languages = [
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' }
  ]

  let isOpen = $state(false)
  let currentLocale = $derived($locale || 'en-US')

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
  <Button
    onclick={toggleDropdown}
    variant="outline"
    size="sm"
    class="flex items-center gap-2"
    aria-label="Select language"
  >
    <span class="text-base">{getCurrentLanguage().flag}</span>
    <span class="hidden sm:inline">{getCurrentLanguage().label}</span>
    <svg
      class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </Button>

  {#if isOpen}
    <div class="absolute top-full right-0 mt-1 w-48 bg-white border border-input rounded-md shadow-lg z-50">
      {#each languages as language (language.code)}
        <button
          onclick={() => selectLanguage(language.code)}
          class="w-full px-4 py-2 text-sm text-left transition flex items-center gap-3 hover:bg-accent {currentLocale === language.code ? 'bg-accent text-accent-foreground' : 'text-foreground'}"
        >
          <span class="text-base">{language.flag}</span>
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
