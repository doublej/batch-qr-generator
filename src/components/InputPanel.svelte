<script lang="ts">
  import type { CSVData } from '../types'
  import { parseCSV } from '../lib/csv-parser'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Button } from '$lib/components/ui/button'
  import * as Tabs from '$lib/components/ui/tabs'
  import { _ } from '../lib/i18n'

  let {
    csvData = $bindable(),
    mode = $bindable(),
    onClearState
  }: {
    csvData: CSVData | null
    mode: 'single' | 'batch'
    onClearState: () => void
  } = $props()

  let loading = $state(false)
  let fileName = $state('')
  let firstRowIsHeader = $state(true)
  let customHeaders = $state<string[]>([])

  async function handleCSVUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    loading = true
    fileName = file.name

    try {
      const data = await parseCSV(file, firstRowIsHeader)
      csvData = data

      if (data.hasCustomHeaders) {
        customHeaders = [...data.headers]
      } else {
        customHeaders = []
      }
    } catch (error) {
      alert($_('errors.csvParsing', { values: { error } }))
      csvData = null
    } finally {
      loading = false
    }
  }

  function handleFirstRowToggle() {
    if (csvData) {
      const input = document.getElementById('csv-upload') as HTMLInputElement
      const file = input.files?.[0]
      if (file) {
        handleCSVUpload({ target: input } as unknown as Event)
      }
    }
  }

  function updateCustomHeader(index: number, value: string) {
    if (!csvData) return

    const oldHeader = csvData.headers[index]
    const newHeader = value || `col_${index + 1}`

    customHeaders[index] = newHeader
    csvData.headers[index] = newHeader

    csvData.rows = csvData.rows.map(row => {
      const newRow = { ...row }
      if (oldHeader !== newHeader) {
        newRow[newHeader] = newRow[oldHeader]
        delete newRow[oldHeader]
      }
      return newRow
    })
  }

  function handleModeChange(newMode: string) {
    mode = newMode as 'single' | 'batch'
  }
</script>

<Card>
  <CardContent class="pt-6 space-y-4">
    <div class="flex items-center justify-end mb-2">
      <Button variant="outline" size="sm" onclick={onClearState}>
        {$_('inputPanel.clearAll')}
      </Button>
    </div>

    <Tabs.Root value={mode} onValueChange={handleModeChange}>
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="single">{$_('inputPanel.single')}</Tabs.Trigger>
        <Tabs.Trigger value="batch">{$_('inputPanel.batch')}</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="single" class="mt-4 space-y-4">
        <p class="text-sm text-muted-foreground">{$_('inputPanel.singleMode')}</p>
      </Tabs.Content>

      <Tabs.Content value="batch" class="mt-4 space-y-4">
        <div class="space-y-2">
          <Label for="csv-upload">{$_('inputPanel.csvUpload')}</Label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onchange={handleCSVUpload}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />

          <div class="flex items-center gap-2 pt-1">
            <Checkbox
              id="first-row-header"
              checked={firstRowIsHeader}
              onCheckedChange={(checked) => {
                firstRowIsHeader = checked === true
                handleFirstRowToggle()
              }}
            />
            <Label for="first-row-header" class="text-sm font-normal cursor-pointer">
              {$_('inputPanel.firstRowHeader')}
            </Label>
          </div>

          {#if loading}
            <p class="text-xs text-muted-foreground">{$_('inputPanel.loadingCSV')}</p>
          {/if}
          {#if csvData}
            <p class="text-xs text-green-600">{$_('inputPanel.loadedRows', { values: { count: csvData.rows.length } })}</p>

            <div class="mt-3 space-y-1">
              <Label class="text-xs text-muted-foreground">{$_('inputPanel.csvPreview')}</Label>
              <div class="border border-border rounded overflow-hidden">
                <table class="w-full text-[10px]">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      {#each csvData.headers as header, idx}
                        <th class="text-left font-semibold px-2 py-1.5 border-r border-border last:border-r-0">
                          {#if csvData.hasCustomHeaders}
                            <input
                              type="text"
                              value={customHeaders[idx]}
                              oninput={(e) => updateCustomHeader(idx, e.currentTarget.value)}
                              placeholder={`col_${idx + 1}`}
                              class="w-full bg-transparent border-b border-muted-foreground/30 px-1 focus:outline-none focus:border-primary"
                            />
                          {:else}
                            {header}
                          {/if}
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each csvData.rows.slice(0, 3) as row}
                      <tr class="border-b border-border last:border-b-0">
                        {#each csvData.headers as header}
                          <td class="px-2 py-1 font-mono border-r border-border last:border-r-0">{row[header] || ''}</td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </CardContent>
</Card>
