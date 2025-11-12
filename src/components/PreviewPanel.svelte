<script lang="ts">
  import type { CSVData } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { replaceVariables } from '../lib/csv-parser'
  import { generateQRDataURL } from '../utils'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'

  let {
    csvData,
    urlPattern,
    labelPattern,
    selectedVariables,
    mode,
    labelEnabled,
    options
  }: {
    csvData: CSVData | null
    urlPattern: string
    labelPattern: string
    selectedVariables: Set<string>
    mode: 'single' | 'batch'
    labelEnabled: boolean
    options: QRDesignOptions
  } = $props()

  let previewQR = $state<string>('')
  let previewLoading = $state(false)
  let previewIndex = $state(0)
  let dpi = $state(300)
  let currentURL = $state<string>('')
  let rowInputValue = $state<string>('1')

  function nextPreview() {
    if (!csvData) return
    previewIndex = (previewIndex + 1) % csvData.rows.length
    rowInputValue = String(previewIndex + 1)
  }

  function prevPreview() {
    if (!csvData) return
    previewIndex = (previewIndex - 1 + csvData.rows.length) % csvData.rows.length
    rowInputValue = String(previewIndex + 1)
  }

  async function updatePreview() {
    if (mode === 'single') {
      if (!urlPattern) {
        previewQR = ''
        currentURL = ''
        return
      }

      previewLoading = true
      currentURL = urlPattern

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

        previewQR = dataUrl
      } catch (error) {
        console.error('Preview generation failed:', error)
        previewQR = ''
      } finally {
        previewLoading = false
      }
    } else {
      if (!csvData || csvData.rows.length === 0) {
        previewQR = ''
        currentURL = ''
        return
      }

      previewLoading = true

      try {
        const row = csvData.rows[previewIndex]
        const url = replaceVariables(urlPattern, row, previewIndex, csvData.rows.length, true)
        const label = replaceVariables(labelPattern, row, previewIndex, csvData.rows.length)
        currentURL = url

        const dataUrl = await generateQRDataURL(url, {
          tileLabel: labelEnabled ? label : '',
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

        previewQR = dataUrl
      } catch (error) {
        console.error('Preview generation failed:', error)
        previewQR = ''
      } finally {
        previewLoading = false
      }
    }
  }

  function downloadPreview() {
    if (!previewQR) return

    if (mode === 'single') {
      const link = document.createElement('a')
      link.download = `${labelPattern || 'qr-code'}.png`
      link.href = previewQR
      link.click()
    } else if (csvData) {
      const row = csvData.rows[previewIndex]
      const label = replaceVariables(labelPattern, row)
      const link = document.createElement('a')
      link.download = `${label || `qr-${previewIndex + 1}`}.png`
      link.href = previewQR
      link.click()
    }
  }

  function handleRowInput(event: Event) {
    const input = event.target as HTMLInputElement
    rowInputValue = input.value
  }

  function commitRowChange() {
    if (!csvData) return
    const rowNumber = parseInt(rowInputValue)

    if (!isNaN(rowNumber) && rowNumber >= 1 && rowNumber <= csvData.rows.length) {
      previewIndex = rowNumber - 1
    } else {
      rowInputValue = String(previewIndex + 1)
    }
  }

  function handleRowKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      commitRowChange()
      ;(event.target as HTMLInputElement).blur()
    }
  }

  $effect(() => {
    if (mode === 'single' && urlPattern) {
      updatePreview()
    } else if (mode === 'batch' && csvData && urlPattern) {
      updatePreview()
    } else {
      previewQR = ''
    }
  })
</script>

<Card class="sticky top-4">
  <CardContent class="pt-6">
    {#if mode === 'single' || csvData}
      <div class="space-y-4">
        {#if previewLoading}
          <div class="flex items-center justify-center py-12">
            <p class="text-muted-foreground">Loading...</p>
          </div>
        {:else if previewQR}
          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Live Preview</span>
              {#if mode === 'batch' && csvData}
                <span class="font-mono">{String(previewIndex + 1).padStart(3, '0')}/{String(csvData.rows.length).padStart(3, '0')}</span>
              {/if}
            </div>

            <div class="relative border overflow-hidden p-4" style="border-radius: var(--radius-inner); background-image: repeating-conic-gradient(#9ca3af 0% 25%, #6b7280 0% 50%); background-size: 20px 20px; background-position: 0 0;">
              <img src={previewQR} alt="Preview QR Code" class="w-full relative z-10" style="border-radius: var(--radius-nested);" />
            </div>

            <div class="space-y-2 text-xs">
              {#if currentURL}
                <div class="break-all">
                  {currentURL}
                </div>
              {/if}

              <div class="text-muted-foreground space-y-1">
                <div>{options.qr.size}px × {options.qr.size}px</div>
                <div class="flex items-center gap-2">
                  <span>Print: {((options.qr.size / dpi) * 25.4).toFixed(1)}mm × {((options.qr.size / dpi) * 25.4).toFixed(1)}mm @</span>
                  <select
                    bind:value={dpi}
                    class="h-6 rounded border border-input bg-background px-2 text-xs"
                  >
                    <option value={72}>72 DPI</option>
                    <option value={150}>150 DPI</option>
                    <option value={300}>300 DPI</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              {#if mode === 'batch' && csvData}
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" onclick={prevPreview} class="w-24">
                    Previous
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={csvData.rows.length}
                    value={rowInputValue}
                    oninput={handleRowInput}
                    onblur={commitRowChange}
                    onkeydown={handleRowKeydown}
                    class="h-9 text-center"
                  />
                  <Button variant="outline" size="sm" onclick={nextPreview} class="w-24">
                    Next
                  </Button>
                </div>
              {/if}
              <Button size="sm" onclick={downloadPreview} class="w-full">
                Download
              </Button>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-center py-12">
            <p class="text-muted-foreground text-center">Preview will appear here</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-center py-12">
        <p class="text-muted-foreground text-center">Configure input to preview</p>
      </div>
    {/if}
  </CardContent>
</Card>
