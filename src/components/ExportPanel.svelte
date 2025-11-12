<script lang="ts">
  import type { CSVData } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { generateQRDataURL, downloadFile } from '../utils'
  import {
    downloadAllQRsFromCSV,
    downloadAllQRsSVGFromCSV,
    downloadPrintPDFFromCSV,
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
  let generationProgress = $state<QRGenerationProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  })

  let generatorManager: QRGeneratorManager | null = null

  onMount(() => {
    generatorManager = new QRGeneratorManager()
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
      const dataUrl = await generateQRDataURL(urlPattern, {
        tileLabel: labelEnabled ? labelPattern : '',
        errorCorrectionLevel: options.qr.errorCorrection,
        logoDataURL: options.logo.enabled ? options.logo.dataURL : '',
        logoSize: options.logo.size,
        logoPlacement: options.logo.placement,
        textSize: options.text.size,
        textPosition: options.text.position,
        textOffsetX: options.text.offsetX,
        textOffsetY: options.text.offsetY,
        showTileLabel: options.text.enabled,
        textAlign: options.text.align,
        textFont: options.text.font,
        textWeight: options.text.weight,
        textColor: options.text.color,
        textRotation: options.text.rotation,
        qrSize: options.qr.size,
        qrPadding: options.qr.padding,
        moduleShape: options.qr.moduleShape,
        backgroundColor: options.colors.background,
        eyeColor: options.colors.eyeColor,
        dataModuleColor: options.colors.dataModuleColor,
        useGradient: options.gradient.enabled,
        gradientType: options.gradient.type,
        gradientStart: options.gradient.start,
        gradientEnd: options.gradient.end,
        gradientAngle: options.gradient.angle
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

  async function handleExportPDF(pageSize: 'A4' | 'A3') {
    if (!csvData) return
    exporting = true

    try {
      await downloadPrintPDFFromCSV(
        csvData,
        urlPattern,
        labelPattern,
        options.qr.errorCorrection,
        options.logo.enabled ? options.logo.dataURL : '',
        options.logo.size,
        options.logo.placement,
        options.text.size,
        0, // text margin (not used)
        options.text.position,
        options.text.enabled,
        options.qr.size,
        options.qr.padding,
        pageSize,
        options.qr.moduleShape
      )
    } finally {
      exporting = false
    }
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
        <p class="text-sm text-muted-foreground">{$_('exportPanel.exportQRCodes', { values: { count: csvData.rows.length } })}</p>

        <div class="grid grid-cols-2 gap-2">
          <Button onclick={() => handleExportZIP('png')} disabled={exporting}>
            {exporting ? $_('exportPanel.exporting') : $_('exportPanel.pngZip')}
          </Button>
          <Button onclick={() => handleExportZIP('svg')} disabled={exporting}>
            {exporting ? $_('exportPanel.exporting') : $_('exportPanel.svgZip')}
          </Button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" onclick={() => handleExportPDF('A4')} disabled={exporting}>
            {$_('exportPanel.pdfA4')}
          </Button>
          <Button variant="outline" onclick={() => handleExportPDF('A3')} disabled={exporting}>
            {$_('exportPanel.pdfA3')}
          </Button>
        </div>

        <Separator />

        <Button variant="secondary" class="w-full" onclick={handleExportCSV}>
          {$_('exportPanel.exportCSV')}
        </Button>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12">
        <p class="text-muted-foreground text-center">{$_('exportPanel.uploadCSVMessage')}</p>
      </div>
    {/if}
  </CardContent>
</Card>
