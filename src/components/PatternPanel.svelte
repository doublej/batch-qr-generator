<script lang="ts">
  import type { CSVData } from '../types'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import VariablePillInput from './VariablePillInput.svelte'

  let {
    csvData,
    urlPattern = $bindable(),
    labelPattern = $bindable(),
    selectedVariables = $bindable(),
    mode,
    labelEnabled = $bindable()
  }: {
    csvData: CSVData | null
    urlPattern: string
    labelPattern: string
    selectedVariables: Set<string>
    mode: 'single' | 'batch'
    labelEnabled: boolean
  } = $props()

  const builtInVariables = ['_row', '_index', '_row_reverse', '_total', '_date', '_timestamp']
</script>

<Card>
  <CardContent class="pt-6 space-y-4">
    {#if mode === 'single'}
      <div class="space-y-2">
        <Label for="single-url">URL</Label>
        <Input
          id="single-url"
          type="text"
          bind:value={urlPattern}
          placeholder="https://example.com/your-link"
        />
      </div>

      <div class="space-y-2 {!labelEnabled ? 'opacity-50' : ''}">
        <div class="flex items-center justify-between">
          <Label for="single-label">Label</Label>
          <div class="flex items-center gap-2">
            <Checkbox
              id="pattern-label-enabled"
              checked={labelEnabled}
              onCheckedChange={(checked) => {
                labelEnabled = checked === true
              }}
            />
            <Label for="pattern-label-enabled" class="text-sm font-normal cursor-pointer">
              Show label
            </Label>
          </div>
        </div>
        <Input
          id="single-label"
          type="text"
          bind:value={labelPattern}
          placeholder="Optional label"
          disabled={!labelEnabled}
        />
      </div>
    {:else}
      <div class="space-y-2">
        <Label class={!csvData ? 'text-muted-foreground' : ''}>URL Pattern</Label>
        {#if csvData}
          <VariablePillInput
            bind:pattern={urlPattern}
            availableVariables={[...csvData.headers, ...builtInVariables]}
            onPatternChange={(p) => (urlPattern = p)}
            firstRowData={csvData.rows[0]}
          />
        {:else}
          <Input disabled placeholder="Upload CSV to configure pattern" />
        {/if}
      </div>

      <div class="space-y-2 {!labelEnabled ? 'opacity-50' : ''}">
        <div class="flex items-center justify-between">
          <Label class={!csvData ? 'text-muted-foreground' : ''}>Label Pattern</Label>
          <div class="flex items-center gap-2">
            <Checkbox
              id="batch-pattern-label-enabled"
              checked={labelEnabled}
              disabled={!csvData}
              onCheckedChange={(checked) => {
                labelEnabled = checked === true
              }}
            />
            <Label for="batch-pattern-label-enabled" class="text-sm font-normal cursor-pointer {!csvData ? 'text-muted-foreground' : ''}">
              Show label
            </Label>
          </div>
        </div>
        {#if csvData}
          <div class:pointer-events-none={!labelEnabled}>
            <VariablePillInput
              bind:pattern={labelPattern}
              availableVariables={[...csvData.headers, ...builtInVariables]}
              onPatternChange={(p) => (labelPattern = p)}
              firstRowData={csvData.rows[0]}
            />
          </div>
          <p class="text-xs text-muted-foreground italic">Examples: "Item &#123;_row&#125;", "&#123;name&#125; - #&#123;_row&#125;"</p>
        {:else}
          <Input disabled placeholder="Upload CSV to configure pattern" />
          <p class="text-xs text-muted-foreground italic">Examples: "Item &#123;_row&#125;", "&#123;name&#125; - #&#123;_row&#125;"</p>
        {/if}
      </div>
    {/if}
  </CardContent>
</Card>
