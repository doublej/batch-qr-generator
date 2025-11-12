<script lang="ts">
  import { untrack } from 'svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import * as Select from '$lib/components/ui/select'

  interface Props {
    pattern: string
    availableVariables: string[] | Record<string, string[]>
    onPatternChange: (pattern: string) => void
    firstRowData?: Record<string, string>
    previewIndex?: number
    totalRows?: number
  }

  let { pattern = $bindable(), availableVariables, onPatternChange, firstRowData, previewIndex = 0, totalRows = 1 }: Props = $props()

  function isGroupedVariables(vars: string[] | Record<string, string[]>): vars is Record<string, string[]> {
    return typeof vars === 'object' && !Array.isArray(vars)
  }

  function getAllVariables(vars: string[] | Record<string, string[]>): string[] {
    if (Array.isArray(vars)) {
      return vars
    }
    return Object.values(vars).flat()
  }

  function getVariablePreview(variable: string, totalRows: number = 1): string {
    if (!firstRowData) return ''

    if (variable.startsWith('_')) {
      switch (variable) {
        case '_row':
          return String(previewIndex + 1)
        case '_index':
          return String(previewIndex)
        case '_row_reverse':
          return String(totalRows - previewIndex)
        case '_total':
          return String(totalRows)
        case '_date':
          return new Date().toISOString().split('T')[0]
        case '_timestamp':
          return String(Date.now())
        default:
          return variable
      }
    }

    return firstRowData[variable] || ''
  }

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
    type: 'text' | 'variable' | 'separator' | 'protocol'
    content: string
    variableName?: string
  }

  function parsePattern(text: string): ParsedPart[] {
    const parts: ParsedPart[] = []

    // First, check for protocol at the beginning
    const protocolMatch = text.match(/^(https?:\/\/)/)
    let startIndex = 0

    if (protocolMatch) {
      parts.push({ type: 'protocol', content: protocolMatch[1] })
      startIndex = protocolMatch[1].length
    }

    // Then parse the rest
    const regex = /(\{[^}]+\})/g
    let lastIndex = startIndex
    let match

    const restText = text.slice(startIndex)
    regex.lastIndex = 0  // Reset regex

    while ((match = regex.exec(restText)) !== null) {
      const actualIndex = match.index + startIndex
      if (actualIndex > lastIndex) {
        // Split text parts into text and separators
        const textPart = text.slice(lastIndex, actualIndex)
        splitTextAndSeparators(textPart).forEach(part => parts.push(part))
      }
      const variableName = match[1].slice(1, -1)
      parts.push({ type: 'variable', content: match[1], variableName })
      lastIndex = startIndex + regex.lastIndex
    }

    if (lastIndex < text.length) {
      // Split remaining text into text and separators
      const textPart = text.slice(lastIndex)
      splitTextAndSeparators(textPart).forEach(part => parts.push(part))
    }

    return parts
  }

  function splitTextAndSeparators(text: string): ParsedPart[] {
    const parts: ParsedPart[] = []
    const separatorRegex = /([/\-?&=:#])/g
    let lastIndex = 0
    let match

    while ((match = separatorRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
      }
      parts.push({ type: 'separator', content: match[1] })
      lastIndex = separatorRegex.lastIndex
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
        case '_row': return String(previewIndex + 1)
        case '_index': return String(previewIndex)
        case '_row_reverse': return String(totalRows - previewIndex)
        case '_total': return String(totalRows)
        case '_date': return new Date().toISOString().split('T')[0]
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
</script>

<div class="space-y-2">
  <div class="relative rounded-lg border border-input bg-muted">
    {#if pattern && firstRowData}
      {#key animationKey}
        <div class="text-xs font-mono p-3 flex items-center gap-0 overflow-x-auto whitespace-nowrap rounded-t-lg">
          {#each parsedParts as part}
            {#if part.type === 'protocol'}
              <span class="protocol-pill inline-block rounded px-1 mr-0.5">{part.content}</span>
            {:else if part.type === 'separator'}
              <span class="text-muted-foreground">{part.content}</span>
            {:else if part.type === 'text' && part.content}
              <span class="text-pill inline-block rounded px-1 mx-0.5">{part.content}</span>
            {:else if part.variableName}
              {@const value = getVariableValue(part.variableName)}
              {@const isBuiltIn = part.variableName.startsWith('_')}
              {@const maxLength = Math.max(part.variableName.length, value.length)}
              {@const displayLength = maxLength}
              <span
                class="pill-container inline-block relative rounded px-1 flex items-center mx-0.5 {isBuiltIn ? 'bg-purple-50 dark:bg-purple-800' : 'bg-blue-50 dark:bg-blue-800'}"
                style="width: auto; min-width: calc({displayLength}ch + 0.75rem); height: 1.5em;"
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
      <div class="text-xs font-mono p-3 rounded-t-lg">
        {#each parsePattern(pattern) as part}
          {#if part.type === 'protocol'}
            <span class="protocol-pill inline-block rounded px-1 mr-0.5">{part.content}</span>
          {:else if part.type === 'separator'}
            <span class="text-muted-foreground">{part.content}</span>
          {:else if part.type === 'text' && part.content}
            <span class="text-pill inline-block rounded px-1 mx-0.5">{part.content}</span>
          {:else if part.type === 'variable'}
            <span class="text-pill inline-block rounded px-1 mx-0.5 bg-gray-200 dark:bg-gray-700">{part.content}</span>
          {/if}
        {/each}
      </div>
    {/if}
    <Input
      type="text"
      bind:value={pattern}
      oninput={handlePatternInput}
      placeholder="e.g., https://example.com/{'{'}{'}'}variable{'}'}"
      class="flex-1 font-mono text-sm border-0 rounded-b-lg {pattern ? 'border-t border-input' : 'rounded-lg'}"
    />
  </div>

  {#if getAllVariables(availableVariables).length > 0}
    <div class="flex gap-2 items-center">
      <span class="text-sm text-muted-foreground">Insert variable:</span>
      <select
        bind:value={selectedVariable}
        class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-inner-lg"
      >
        <option value="">Select...</option>
        {#if isGroupedVariables(availableVariables)}
          {#each Object.entries(availableVariables) as [group, variables]}
            <optgroup label={group}>
              {#each variables as variable}
                {@const preview = getVariablePreview(variable, totalRows)}
                <option value={variable}>{variable}</option>
                {#if preview}
                  <option disabled>  → {preview}</option>
                {/if}
              {/each}
            </optgroup>
          {/each}
        {:else}
          {#each availableVariables as variable}
            {@const preview = getVariablePreview(variable, totalRows)}
            <option value={variable}>{variable}</option>
            {#if preview}
              <option disabled>  → {preview}</option>
            {/if}
          {/each}
        {/if}
      </select>
      <Button size="sm" onclick={insertVariable} disabled={!selectedVariable}>
        Insert
      </Button>
    </div>
  {/if}
</div>

<style>
  .protocol-pill {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    font-variant-ligatures: none;
    font-size: 0.7rem;
    font-weight: 300;
    color: hsl(var(--muted-foreground) / 0.5);
    border: 1px solid hsl(var(--muted-foreground) / 0.15);
    background-color: hsl(var(--muted) / 0.3);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .text-pill {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    font-variant-ligatures: none;
    font-size: 0.7rem;
    font-weight: 300;
    color: inherit;
    border: 1px solid hsl(var(--muted-foreground) / 0.3);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .pill-container {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    font-variant-ligatures: none;
    font-size: 0.7rem;
    font-weight: 300;
    animation: colorPulse 12s ease-in-out infinite;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
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
