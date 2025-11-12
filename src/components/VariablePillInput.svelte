<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import * as Select from '$lib/components/ui/select'

  interface Props {
    pattern: string
    availableVariables: string[]
    onPatternChange: (pattern: string) => void
  }

  let { pattern = $bindable(), availableVariables, onPatternChange }: Props = $props()

  let selectedVariable = $state('')

  function insertVariable() {
    if (!selectedVariable) return

    const cursorPos = pattern.length
    const variable = `{${selectedVariable}}`
    pattern = pattern + variable

    if (onPatternChange) {
      onPatternChange(pattern)
    }

    selectedVariable = ''
  }

  function highlightVariables(text: string): string {
    return text
      .replace(/(\{_[^}]+\})/g, '<span class="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 rounded">$1</span>')
      .replace(/(\{[^}]+\})/g, '<span class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded">$1</span>')
  }

  function handlePatternInput(e: Event) {
    const target = e.target as HTMLInputElement
    pattern = target.value
    if (onPatternChange) {
      onPatternChange(pattern)
    }
  }

  $effect(() => {
    if (onPatternChange) {
      onPatternChange(pattern)
    }
  })
</script>

<div class="space-y-2">
  <div class="flex gap-2">
    <Input
      type="text"
      bind:value={pattern}
      oninput={handlePatternInput}
      placeholder="e.g., https://example.com/{'{'}{'}'}variable{'}'}"
      class="flex-1 font-mono text-sm"
    />
  </div>

  {#if availableVariables.length > 0}
    <div class="flex gap-2 items-center">
      <span class="text-sm text-muted-foreground">Insert variable:</span>
      <select
        bind:value={selectedVariable}
        class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">Select...</option>
        {#each availableVariables as variable}
          <option value={variable}>{variable}</option>
        {/each}
      </select>
      <Button size="sm" onclick={insertVariable} disabled={!selectedVariable}>
        Insert
      </Button>
    </div>
  {/if}

  {#if pattern}
    <div class="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
      Preview: {@html highlightVariables(pattern)}
    </div>
  {/if}
</div>
