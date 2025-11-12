<script lang="ts">
  import { untrack } from 'svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import * as Select from '$lib/components/ui/select'

  interface Props {
    pattern: string
    availableVariables: string[]
    onPatternChange: (pattern: string) => void
    firstRowData?: Record<string, string>
  }

  let { pattern = $bindable(), availableVariables, onPatternChange, firstRowData }: Props = $props()

  let selectedVariable = $state('')
  let animationKey = $state(0)

  $effect(() => {
    pattern
    untrack(() => animationKey++)
  })

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

  interface ParsedPart {
    type: 'text' | 'variable'
    content: string
    variableName?: string
  }

  function parsePattern(text: string): ParsedPart[] {
    const parts: ParsedPart[] = []
    const regex = /(\{[^}]+\})/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
      }
      const variableName = match[1].slice(1, -1)
      parts.push({ type: 'variable', content: match[1], variableName })
      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) })
    }

    return parts
  }

  function getVariableValue(variableName: string): string {
    if (!firstRowData) return variableName

    if (variableName.startsWith('_')) {
      switch (variableName) {
        case '_row': return '1'
        case '_index': return '0'
        case '_row_reverse': return String(Object.keys(firstRowData).length || 1)
        case '_total': return String(Object.keys(firstRowData).length || 1)
        case '_date': return new Date().toLocaleDateString()
        case '_timestamp': return String(Date.now())
        default: return variableName
      }
    }

    return firstRowData[variableName] || variableName
  }

  let parsedParts = $derived(parsePattern(pattern))

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

  {#if pattern && firstRowData}
    {#key animationKey}
      <div class="text-xs font-mono bg-muted p-2 rounded flex items-center gap-0 overflow-x-auto whitespace-nowrap">
        {#each parsedParts as part}
          {#if part.type === 'text'}
            <span class="text-foreground">{part.content}</span>
          {:else if part.variableName}
            {@const value = getVariableValue(part.variableName)}
            {@const isBuiltIn = part.variableName.startsWith('_')}
            {@const maxLength = Math.max(part.variableName.length, value.length)}
            {@const displayLength = Math.min(maxLength, 30)}
            <span
              class="pill-container inline-block relative rounded px-1 flex items-center mx-0.5 {isBuiltIn ? 'bg-purple-50 dark:bg-purple-800' : 'bg-blue-50 dark:bg-blue-800'}"
              style="width: calc({displayLength * 0.6}em + 0.5rem); height: 1.5em;"
            >
              <span class="pill-text absolute inset-0 px-1 overflow-hidden whitespace-nowrap flex items-center justify-center {isBuiltIn ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'}">
                {#each part.variableName.padEnd(maxLength, ' ').split('') as char, i}
                  <span class="variable-char inline-block" style="animation-delay: {i * 0.03}s">{char}</span>
                {/each}
              </span>
              <span class="pill-text absolute inset-0 px-1 overflow-hidden whitespace-nowrap flex items-center justify-center {isBuiltIn ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'}">
                {#each value.padEnd(maxLength, ' ').split('') as char, i}
                  <span class="value-char inline-block" style="animation-delay: {i * 0.03}s">{char}</span>
                {/each}
              </span>
            </span>
          {/if}
        {/each}
      </div>
    {/key}
  {:else if pattern}
    <div class="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
      {pattern}
    </div>
  {/if}
</div>

<style>
  .pill-container {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    font-variant-ligatures: none;
    font-size: 0.7rem;
    font-weight: 300;
    animation: colorPulse 12s ease-in-out infinite;
  }

  .pill-text {
    mask-image: linear-gradient(to right,
      transparent 0%,
      black 0.25rem,
      black calc(100% - 0.25rem),
      transparent 100%);
    -webkit-mask-image: linear-gradient(to right,
      transparent 0%,
      black 0.25rem,
      black calc(100% - 0.25rem),
      transparent 100%);
  }

  @keyframes wipeOut {
    0%, 40% {
      opacity: 1;
      transform: translateX(0);
    }
    42% {
      opacity: 0;
      transform: translateX(-100%);
    }
    42.1%, 78% {
      opacity: 0;
      transform: translateX(-100%);
    }
    80% {
      opacity: 0;
      transform: translateX(100%);
    }
    82%, 100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes wipeIn {
    0%, 42% {
      opacity: 0;
      transform: translateX(100%);
    }
    44% {
      opacity: 1;
      transform: translateX(0);
    }
    78%, 80% {
      opacity: 1;
      transform: translateX(0);
    }
    82%, 100% {
      opacity: 0;
      transform: translateX(-100%);
    }
  }

  @keyframes colorPulse {
    0%, 38% {
      filter: brightness(1);
    }
    41% {
      filter: brightness(1.4);
    }
    44% {
      filter: brightness(0.7);
    }
    47% {
      filter: brightness(1.4);
    }
    50%, 76% {
      filter: brightness(1);
    }
    79% {
      filter: brightness(1.4);
    }
    82% {
      filter: brightness(0.7);
    }
    85% {
      filter: brightness(1.4);
    }
    88%, 100% {
      filter: brightness(1);
    }
  }

  .variable-char {
    opacity: 1;
    transform: translateX(0);
    animation: wipeOut 12s ease-in-out infinite;
  }

  .value-char {
    opacity: 0;
    transform: translateX(100%);
    animation: wipeIn 12s ease-in-out infinite;
  }
</style>
