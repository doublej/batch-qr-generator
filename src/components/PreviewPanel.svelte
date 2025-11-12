<script lang="ts">
  import type { CSVData } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { replaceVariables } from '../lib/csv-parser'
  import { generateQRDataURL } from '../utils'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { _ } from '../lib/i18n'

  let {
    csvData,
    urlPattern,
    labelPattern,
    selectedVariables,
    mode,
    labelEnabled,
    options,
    onPreviewIndexChange
  }: {
    csvData: CSVData | null
    urlPattern: string
    labelPattern: string
    selectedVariables: Set<string>
    mode: 'single' | 'batch'
    labelEnabled: boolean
    options: QRDesignOptions
    onPreviewIndexChange?: (index: number) => void
  } = $props()

  let previewQR = $state<string>('')
  let previewLoading = $state(false)
  let previewIndex = $state(0)
  let dpi = $state(300)
  let currentURL = $state<string>('')
  let rowInputValue = $state<string>('1')

  // Inverse scaling: smaller QR = larger grid, larger QR = smaller grid
  // Base is 25px at 500px QR size
  let checkerSize = $derived(Math.max(10, Math.min(50, (500 / options.qr.size) * 25)))

  function nextPreview() {
    if (!csvData) return
    previewIndex = (previewIndex + 1) % csvData.rows.length
    rowInputValue = String(previewIndex + 1)
    onPreviewIndexChange?.(previewIndex)
  }

  function prevPreview() {
    if (!csvData) return
    previewIndex = (previewIndex - 1 + csvData.rows.length) % csvData.rows.length
    rowInputValue = String(previewIndex + 1)
    onPreviewIndexChange?.(previewIndex)
  }

  async function updatePreview() {
    if (mode === 'single') {
      if (!urlPattern) {
        previewQR = ''
        currentURL = ''
        return
      }

      // Show loading state when generating a new QR
      previewLoading = true
      currentURL = urlPattern

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

      // Show loading state when generating a new QR
      previewLoading = true

      try {
        const row = csvData.rows[previewIndex]
        const url = replaceVariables(urlPattern, row, previewIndex, csvData.rows.length)
        const label = replaceVariables(labelPattern, row, previewIndex, csvData.rows.length)
        currentURL = url

        const dataUrl = await generateQRDataURL(url, {
          tileLabel: labelEnabled ? label : '',
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
      onPreviewIndexChange?.(previewIndex)
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
    // Trigger on any option changes including padding
    options.qr.padding?.top
    options.qr.padding?.right
    options.qr.padding?.bottom
    options.qr.padding?.left
    options.qr.size
    options.qr.errorCorrection
    options.qr.moduleShape
    options.logo.enabled
    options.logo.dataURL
    options.logo.size
    options.logo.placement
    options.text.enabled
    options.text.size
    options.text.position
    options.text.offsetX
    options.text.offsetY
    options.text.align
    options.text.font
    options.text.weight
    options.text.color
    options.text.rotation
    options.colors.eyeColor
    options.colors.dataModuleColor
    options.gradient.enabled
    options.gradient.type
    options.gradient.startColor
    options.gradient.endColor
    options.gradient.angle
    labelEnabled
    labelPattern

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
        {#if previewQR || previewLoading}
          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{$_('previewPanel.livePreview')}</span>
              {#if mode === 'batch' && csvData}
                <span class="font-mono">{String(previewIndex + 1).padStart(3, '0')}/{String(csvData.rows.length).padStart(3, '0')}</span>
              {/if}
            </div>

            <div class="qr-preview-container relative border overflow-hidden p-8" style="border-radius: var(--radius-inner); background-image: repeating-conic-gradient(#9ca3af 0% 25%, #6b7280 0% 50%); background-size: {checkerSize}px {checkerSize}px; background-position: 0 0;">
              {#if previewQR}
                <img src={previewQR} alt="Preview QR Code" class="w-full relative z-10" style="border-radius: var(--radius-nested); max-width: 100%; height: auto;" />
              {:else}
                <div class="flex items-center justify-center py-12">
                  <p class="text-muted-foreground">{$_('previewPanel.generating')}</p>
                </div>
              {/if}
              {#if previewLoading}
                <div class="breathing-gradient absolute inset-0 z-20 pointer-events-none"></div>
              {/if}
            </div>

            <div class="space-y-2 text-xs">
              {#if currentURL}
                <div class="break-all">
                  {currentURL}
                </div>
              {/if}

              <div class="text-muted-foreground space-y-1">
                <div>{options.qr.size}px × {options.qr.size}px ({checkerSize.toFixed(0)}px grid)</div>
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
                    {$_('previewPanel.previous')}
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
                    {$_('previewPanel.next')}
                  </Button>
                </div>
              {/if}
              <Button size="sm" onclick={downloadPreview} class="w-full">
                {$_('previewPanel.download')}
              </Button>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-center py-12">
            <p class="text-muted-foreground text-center">{$_('previewPanel.previewPlaceholder')}</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-center py-12">
        <p class="text-muted-foreground text-center">{$_('previewPanel.configureInput')}</p>
      </div>
    {/if}
  </CardContent>
</Card>

<style>
  @keyframes breathingGradient {
    0% {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0) 0%,
        rgba(59, 130, 246, 0.4) 10%,
        rgba(139, 92, 246, 0.4) 20%,
        rgba(139, 92, 246, 0) 30%,
        transparent 100%
      );
      transform: translateX(-100%) translateY(-100%);
    }
    50% {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0) 0%,
        rgba(59, 130, 246, 0.5) 25%,
        rgba(139, 92, 246, 0.5) 50%,
        rgba(139, 92, 246, 0) 75%,
        transparent 100%
      );
      transform: translateX(0%) translateY(0%);
    }
    100% {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0) 0%,
        rgba(59, 130, 246, 0.4) 10%,
        rgba(139, 92, 246, 0.4) 20%,
        rgba(139, 92, 246, 0) 30%,
        transparent 100%
      );
      transform: translateX(100%) translateY(100%);
    }
  }

  .breathing-gradient {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.3) 0%,
      rgba(139, 92, 246, 0.3) 100%
    );
    animation: breathingGradient 2s ease-in-out infinite;
    mix-blend-mode: screen;
  }

  .qr-preview-container {
    position: relative;
  }
</style>
