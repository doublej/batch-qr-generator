<script lang="ts">
  import type { CSVData } from '../types'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import VariablePillInput from './VariablePillInput.svelte'
  import { _ } from '../lib/i18n'

  let {
    csvData,
    urlPattern = $bindable(),
    labelPattern = $bindable(),
    selectedVariables = $bindable(),
    mode,
    labelEnabled = $bindable(),
    previewIndex = 0
  }: {
    csvData: CSVData | null
    urlPattern: string
    labelPattern: string
    selectedVariables: Set<string>
    mode: 'single' | 'batch'
    labelEnabled: boolean
    previewIndex?: number
  } = $props()

  const builtInVariables = ['_row', '_index', '_row_reverse', '_total', '_date', '_timestamp']

  function getGroupedVariables() {
    return {
      'CSV Data': csvData?.headers || [],
      'General Properties': builtInVariables
    }
  }
</script>

<div class="space-y-4">
  {#if mode === 'single'}
    <Card>
      <CardContent class="pt-6 space-y-4">
        <div class="space-y-2">
          <Label for="single-url">{$_('patternPanel.url')}</Label>
          <Input
            id="single-url"
            type="text"
            bind:value={urlPattern}
            placeholder={$_('patternPanel.urlPlaceholder')}
          />
        </div>

        <div class="space-y-2 {!labelEnabled ? 'opacity-50' : ''}">
          <div class="flex items-center justify-between">
            <Label for="single-label">{$_('patternPanel.label')}</Label>
            <div class="flex items-center gap-2">
              <Checkbox
                id="pattern-label-enabled"
                checked={labelEnabled}
                onCheckedChange={(checked) => {
                  labelEnabled = checked === true
                }}
              />
              <Label for="pattern-label-enabled" class="text-sm font-normal cursor-pointer">
                {$_('patternPanel.showLabel')}
              </Label>
            </div>
          </div>
          <Input
            id="single-label"
            type="text"
            bind:value={labelPattern}
            placeholder={$_('patternPanel.labelPlaceholder')}
            disabled={!labelEnabled}
          />
        </div>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="pt-6 space-y-2">
        <Label class={!csvData ? 'text-muted-foreground' : ''}>{$_('patternPanel.urlPattern')}</Label>
        {#if csvData}
          <VariablePillInput
            bind:pattern={urlPattern}
            availableVariables={getGroupedVariables()}
            onPatternChange={() => {}}
            firstRowData={csvData.rows[previewIndex]}
            {previewIndex}
            totalRows={csvData.rows.length}
          />
        {:else}
          <Input disabled placeholder={$_('patternPanel.uploadCSV')} />
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardContent class="pt-6 space-y-2 {!labelEnabled ? 'opacity-50' : ''}">
        <div class="flex items-center justify-between">
          <Label class={!csvData ? 'text-muted-foreground' : ''}>{$_('patternPanel.labelPattern')}</Label>
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
              {$_('patternPanel.showLabel')}
            </Label>
          </div>
        </div>
        {#if csvData}
          <div class:pointer-events-none={!labelEnabled}>
            <VariablePillInput
              bind:pattern={labelPattern}
              availableVariables={getGroupedVariables()}
              onPatternChange={() => {}}
              firstRowData={csvData.rows[previewIndex]}
              {previewIndex}
              totalRows={csvData.rows.length}
            />
          </div>

        {:else}
          <Input disabled placeholder={$_('patternPanel.uploadCSV')} />

        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
