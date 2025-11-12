<script lang="ts">
  import type { CSVData } from '../types'
  import { parseCSV, replaceVariables } from '../lib/csv-parser'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Separator } from '$lib/components/ui/separator'
  import VariablePillInput from './VariablePillInput.svelte'
  import * as Tabs from '$lib/components/ui/tabs'

  let {
    csvData = $bindable(),
    urlPattern = $bindable(),
    labelPattern = $bindable(),
    selectedVariables = $bindable(),
    mode = $bindable()
  }: {
    csvData: CSVData | null
    urlPattern: string
    labelPattern: string
    selectedVariables: Set<string>
    mode: 'single' | 'batch'
  } = $props()

  let loading = $state(false)
  let fileName = $state('')
  let singleURL = $state('https://example.com/example123')
  let singleLabel = $state('Example QR')

  async function handleCSVUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    loading = true
    fileName = file.name

    try {
      const data = await parseCSV(file)
      csvData = data
      selectedVariables = new Set(data.headers)
    } catch (error) {
      alert(`Error parsing CSV: ${error}`)
      csvData = null
    } finally {
      loading = false
    }
  }

  function toggleVariable(variable: string) {
    if (selectedVariables.has(variable)) {
      selectedVariables.delete(variable)
    } else {
      selectedVariables.add(variable)
    }
    selectedVariables = selectedVariables
  }

  function handleModeChange(newMode: string) {
    mode = newMode as 'single' | 'batch'

    if (mode === 'single') {
      urlPattern = singleURL
      labelPattern = singleLabel
    } else {
      urlPattern = 'https://example.com/'
      labelPattern = ''
    }
  }

  $effect(() => {
    if (mode === 'single') {
      urlPattern = singleURL
      labelPattern = singleLabel
    }
  })

  const builtInVariables = ['_row', '_index', '_row_reverse', '_total', '_date', '_timestamp']
</script>

<Card>
  <CardContent class="pt-6 space-y-4">
    <Tabs.Root value={mode} onValueChange={handleModeChange}>
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="single">Single QR Code</Tabs.Trigger>
        <Tabs.Trigger value="batch">CSV Batch Import</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="single" class="mt-4 space-y-4">
        <div class="space-y-2">
          <Label for="single-url">QR Code URL</Label>
          <Input
            id="single-url"
            type="text"
            bind:value={singleURL}
            placeholder="https://example.com/your-link"
          />
        </div>

        <div class="space-y-2">
          <Label for="single-label">Label Text (optional)</Label>
          <Input
            id="single-label"
            type="text"
            bind:value={singleLabel}
            placeholder="Optional label below QR code"
          />
        </div>
      </Tabs.Content>

      <Tabs.Content value="batch" class="mt-4 space-y-4">
        <div class="space-y-2">
          <Label for="csv-upload">CSV File Upload</Label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onchange={handleCSVUpload}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
          {#if loading}
            <p class="text-xs text-muted-foreground">Loading CSV...</p>
          {/if}
          {#if csvData}
            <p class="text-xs text-green-600">Loaded {csvData.rows.length} rows</p>
          {/if}
        </div>

        {#if csvData}
          <div class="space-y-2">
            <Label>QR Code URL Pattern</Label>
            <VariablePillInput
              bind:pattern={urlPattern}
              availableVariables={[...csvData.headers, ...builtInVariables]}
              onPatternChange={(p) => (urlPattern = p)}
            />
          </div>

          <div class="space-y-2">
            <Label>Label Pattern</Label>
            <VariablePillInput
              bind:pattern={labelPattern}
              availableVariables={[...csvData.headers, ...builtInVariables]}
              onPatternChange={(p) => (labelPattern = p)}
            />
            <p class="text-xs text-muted-foreground italic">Examples: "Item {_row}", "{name} - #{_row}"</p>
          </div>

          {#if csvData.rows.length > 0}
            <Separator />
            <div class="space-y-1">
              <Label class="text-xs">Sample ({Math.min(5, csvData.rows.length)} first + {Math.min(5, csvData.rows.length)} last)</Label>
              <div class="text-[10px] leading-tight border border-border rounded overflow-hidden">
                <div class="grid" style="grid-template-columns: auto 1fr auto;">
                  {#each csvData.rows.slice(0, 5) as row, idx}
                    <div class="text-muted-foreground text-right font-mono px-1.5 py-0.5 border-b border-r border-border bg-muted/50">#{idx + 1}</div>
                    <div class="font-mono truncate px-1.5 py-0.5 border-b border-r border-border">{replaceVariables(urlPattern, row, idx, csvData.rows.length)}</div>
                    <div class="font-mono px-1.5 py-0.5 border-b border-border">{replaceVariables(labelPattern, row, idx, csvData.rows.length)}</div>
                  {/each}

                  {#if csvData.rows.length > 10}
                    <div class="col-span-3 text-center text-muted-foreground py-1 border-b border-border bg-muted/30">⋯ {csvData.rows.length - 10} more ⋯</div>
                  {/if}

                  {#if csvData.rows.length > 5}
                    {#each csvData.rows.slice(-5) as row, idx}
                      <div class="text-muted-foreground text-right font-mono px-1.5 py-0.5 border-b border-r border-border bg-muted/50 last:border-b-0">#{csvData.rows.length - 5 + idx + 1}</div>
                      <div class="font-mono truncate px-1.5 py-0.5 border-b border-r border-border last:border-b-0">{replaceVariables(urlPattern, row, csvData.rows.length - 5 + idx, csvData.rows.length)}</div>
                      <div class="font-mono px-1.5 py-0.5 border-b border-border last:border-b-0">{replaceVariables(labelPattern, row, csvData.rows.length - 5 + idx, csvData.rows.length)}</div>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  </CardContent>
</Card>
