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

  async function handleExportSingle() {
    exporting = true

    try {
      const dataUrl = await generateQRDataURL(urlPattern, {
        tileLabel: labelEnabled ? labelPattern : '',
        errorCorrectionLevel: options.qr.errorCorrectionLevel,
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
        qrMargin: options.qr.margin,
        moduleShape: options.qr.moduleShape,
        eyeColor: options.colors.eyeColor,
        dataModuleColor: options.colors.dataModuleColor,
        useGradient: options.gradient.enabled,
        gradientType: options.gradient.type,
        gradientStart: options.gradient.startColor,
        gradientEnd: options.gradient.endColor,
        gradientAngle: options.gradient.angle
      })

      const blob = await (await fetch(dataUrl)).blob()
      downloadFile(blob, `${labelPattern || 'qr-code'}.png`)
    } finally {
      exporting = false
    }
  }

  async function handleExportZIP(format: 'png' | 'svg') {
    if (!csvData) return
    exporting = true

    try {
      if (format === 'png') {
        await downloadAllQRsFromCSV(
          csvData,
          urlPattern,
          labelPattern,
          options.qr.errorCorrectionLevel,
          options.logo.enabled ? options.logo.dataURL : '',
          options.logo.size,
          options.logo.placement,
          options.text.size,
          options.text.margin,
          options.text.position,
          options.text.enabled,
          options.qr.size,
          options.qr.margin,
          options.qr.moduleShape
        )
      } else {
        await downloadAllQRsSVGFromCSV(
          csvData,
          urlPattern,
          labelPattern,
          options.qr.errorCorrectionLevel,
          options.logo.enabled ? options.logo.dataURL : '',
          options.logo.size,
          options.logo.placement,
          options.text.size,
          options.text.margin,
          options.text.position,
          options.text.enabled,
          options.qr.size,
          options.qr.margin,
          options.qr.moduleShape
        )
      }
    } finally {
      exporting = false
    }
  }

  async function handleExportPDF(pageSize: 'A4' | 'A3') {
    if (!csvData) return
    exporting = true

    try {
      await downloadPrintPDFFromCSV(
        csvData,
        urlPattern,
        labelPattern,
        options.qr.errorCorrectionLevel,
        options.logo.enabled ? options.logo.dataURL : '',
        options.logo.size,
        options.logo.placement,
        options.text.size,
        options.text.margin,
        options.text.position,
        options.text.enabled,
        options.qr.size,
        options.qr.margin,
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

<Card>
  <CardContent class="pt-6 space-y-4">
    {#if mode === 'single'}
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">Download your single QR code</p>
        <Button class="w-full" size="lg" onclick={handleExportSingle} disabled={exporting || !urlPattern}>
          {exporting ? 'Exporting...' : 'Download QR Code (PNG)'}
        </Button>
      </div>
    {:else if csvData}
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">Export {csvData.rows.length} QR codes</p>

        <div class="grid grid-cols-2 gap-2">
          <Button onclick={() => handleExportZIP('png')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'PNG (ZIP)'}
          </Button>
          <Button onclick={() => handleExportZIP('svg')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'SVG (ZIP)'}
          </Button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" onclick={() => handleExportPDF('A4')} disabled={exporting}>
            PDF (A4)
          </Button>
          <Button variant="outline" onclick={() => handleExportPDF('A3')} disabled={exporting}>
            PDF (A3)
          </Button>
        </div>

        <Separator />

        <Button variant="secondary" class="w-full" onclick={handleExportCSV}>
          Export CSV Data
        </Button>
      </div>
    {:else}
      <div class="flex items-center justify-center py-12">
        <p class="text-muted-foreground text-center">Upload a CSV file in the Input tab to export batch QR codes</p>
      </div>
    {/if}
  </CardContent>
</Card>
