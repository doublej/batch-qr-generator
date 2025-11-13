<script lang="ts">
  import type { CSVData } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { generateQR } from '../lib/qr-generation'
  import {
    downloadFile,
    downloadAllQRsFromCSV,
    downloadAllQRsSVGFromCSV,
    downloadCSVData
  } from '../utils'
  import { replaceVariables } from '../lib/csv-parser'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Separator } from '$lib/components/ui/separator'
  import ProgressModal from './ProgressModal.svelte'
  import { QRGeneratorManager, type QRGenerationProgress } from '../lib/qr-worker-utils'
  import { onMount, onDestroy } from 'svelte'
  import { _ } from '../lib/i18n'
  import InfoTooltip from './InfoTooltip.svelte'

  let {
    csvData,
    urlPattern,
    labelPattern,
    mode,
    labelEnabled,
    options
  }: {
    csvData: CSVData | null
    urlPattern: string
    labelPattern: string
    mode: 'single' | 'batch'
    labelEnabled: boolean
    options: QRDesignOptions
  } = $props()

  let exporting = $state(false)
  let showProgressModal = $state(false)
  let isLocalhost = $state(false)
  let generationProgress = $state<QRGenerationProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  })

  let generatorManager: QRGeneratorManager | null = null

  onMount(() => {
    generatorManager = new QRGeneratorManager()
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      isLocalhost = host === 'localhost' || host === '127.0.0.1'
    }
    generatorManager.setProgressCallback((progress) => {
      generationProgress = progress

      // Auto-close modal after completion
      if (progress.status === 'completed') {
        setTimeout(() => {
          showProgressModal = false
        }, 1500)
      }
    })
  })

  onDestroy(() => {
    generatorManager?.destroy()
  })

  async function handleExportSingle() {
    exporting = true

    try {
      const dataUrl = await generateQR({
        text: urlPattern,
        format: 'png',
        options,
        tileLabel: labelEnabled ? labelPattern : undefined
      })

      const blob = await (await fetch(dataUrl)).blob()
      downloadFile(blob, `${labelPattern || 'qr-code'}.png`)
    } finally {
      exporting = false
    }
  }

  async function handleExportZIP(format: 'png' | 'svg') {
    if (!csvData || !generatorManager) return

    exporting = true
    showProgressModal = true
    generationProgress = {
      current: 0,
      total: csvData.rows.length,
      percentage: 0,
      status: 'idle'
    }

    try {
      const blob = await generatorManager.generateBatch(
        csvData,
        urlPattern,
        labelEnabled ? labelPattern : '',
        format,
        options
      )

      downloadFile(blob, `qrcodes-${format}.zip`)
    } catch (error) {
      console.error('Error generating QR codes:', error)
      generationProgress = {
        ...generationProgress,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate QR codes'
      }
    } finally {
      exporting = false
    }
  }

  function handleCancelGeneration() {
    generatorManager?.cancel()
    showProgressModal = false
    exporting = false
  }

  function handleExportCSV() {
    if (!csvData) return
    downloadCSVData(csvData, urlPattern, labelPattern, 'data.csv')
  }
</script>

<ProgressModal
  bind:open={showProgressModal}
  bind:progress={generationProgress}
  onCancel={handleCancelGeneration}
/>

<Card>
  <CardContent class="pt-6 space-y-4">
    {#if mode === 'single'}
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">{$_('exportPanel.singleDownload')}</p>
        <Button class="w-full" size="lg" onclick={handleExportSingle} disabled={exporting || !urlPattern}>
          {exporting ? $_('exportPanel.exporting') : $_('exportPanel.downloadQRCode')}
        </Button>
      </div>
    {:else if csvData}
      <div class="space-y-4">
        <div class="flex items-start justify-between gap-2 text-sm text-muted-foreground">
          <p class="flex-1">{$_('exportPanel.exportQRCodes', { values: { count: csvData.rows.length } })}</p>
          <InfoTooltip text={$_('tooltips.exportZip')} side="left" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Button onclick={() => handleExportZIP('png')} disabled={exporting}>
            {exporting ? $_('exportPanel.exporting') : $_('exportPanel.pngZip')}
          </Button>
          <Button onclick={() => handleExportZIP('svg')} disabled={exporting}>
            {exporting ? $_('exportPanel.exporting') : $_('exportPanel.svgZip')}
          </Button>
        </div>

        <Separator />

        <div class="flex items-center gap-2">
          <Button variant="secondary" class="w-full" onclick={handleExportCSV}>
            {$_('exportPanel.exportCSV')}
          </Button>
          <InfoTooltip text={$_('tooltips.exportCsv')} side="left" />
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12">
        <p class="text-muted-foreground text-center">{$_('exportPanel.uploadCSVMessage')}</p>
      </div>
    {/if}
  </CardContent>
</Card>
