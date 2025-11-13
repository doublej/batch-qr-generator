<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { themes, applyTheme, getStoredTheme } from '../lib/themes'

  let isOpen = $state(false)
  let currentTheme = $state(getStoredTheme())

  function getCurrentTheme() {
    return themes.find(t => t.name === currentTheme) || themes[0]
  }

  function selectTheme(themeName: string) {
    const theme = themes.find(t => t.name === themeName)
    if (theme) {
      applyTheme(theme)
      currentTheme = themeName
    }
    isOpen = false
  }

  function toggleDropdown() {
    isOpen = !isOpen
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.theme-switcher')) {
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

<div class="relative theme-switcher">
  <Button
    onclick={toggleDropdown}
    variant="outline"
    size="sm"
    class="flex items-center gap-2"
    aria-label="Select theme"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
    <span class="hidden sm:inline">{getCurrentTheme().label}</span>
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
    <div class="absolute top-full right-0 mt-1 w-56 bg-card border border-input rounded-md shadow-lg z-50">
      {#each themes as theme (theme.name)}
        <button
          onclick={() => selectTheme(theme.name)}
          class="w-full px-4 py-2 text-sm text-left transition flex items-center gap-3 hover:bg-accent {currentTheme === theme.name ? 'bg-accent text-accent-foreground' : 'text-card-foreground'}"
        >
          <div class="w-4 h-4 rounded-full border-2 border-current" style="background: hsl({theme.colors.primary})"></div>
          <span>{theme.label}</span>
          {#if currentTheme === theme.name}
            <svg class="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
