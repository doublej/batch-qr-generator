<script lang="ts">
  import type { CSVData } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { replaceVariables } from '../lib/csv-parser'
  import { generateQR } from '../lib/qr-generation'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { _ } from '../lib/i18n'
  import InfoTooltip from './InfoTooltip.svelte'

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
  let updateTimeout: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null
  let logoCache = $state<Map<string, HTMLImageElement>>(new Map())

  // Inverse scaling for checkerboard background pattern
  // Smaller QR (200px) → larger grid (62px), Larger QR (800px) → smaller grid (15px)
  // Base reference: 25px grid at 500px QR size
  // Clamped between 10px and 50px for visual consistency
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
    if (abortController) abortController.abort()
    abortController = new AbortController()
    const signal = abortController.signal

    if (mode === 'single') {
      if (!urlPattern) {
        previewQR = ''
        currentURL = ''
        return
      }

      previewLoading = true
      currentURL = urlPattern

      try {
        if (signal.aborted) return

        const dataUrl = await generateQR({
          text: urlPattern,
          format: 'png',
          options,
          tileLabel: labelEnabled ? labelPattern : undefined
        })

        if (!signal.aborted) {
          previewQR = dataUrl
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Preview generation failed:', error)
          previewQR = ''
        }
      } finally {
        if (!signal.aborted) {
          previewLoading = false
        }
      }
    } else {
      if (!csvData || csvData.rows.length === 0) {
        previewQR = ''
        currentURL = ''
        return
      }

      previewLoading = true

      try {
        if (signal.aborted) return

        const row = csvData.rows[previewIndex]
        const url = replaceVariables(urlPattern, row, previewIndex, csvData.rows.length)
        const label = replaceVariables(labelPattern, row, previewIndex, csvData.rows.length)
        currentURL = url

        const dataUrl = await generateQR({
          text: url,
          format: 'png',
          options,
          tileLabel: labelEnabled ? label : undefined
        })

        if (!signal.aborted) {
          previewQR = dataUrl
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Preview generation failed:', error)
          previewQR = ''
        }
      } finally {
        if (!signal.aborted) {
          previewLoading = false
        }
      }
    }
  }

  function debouncedUpdatePreview() {
    if (updateTimeout) clearTimeout(updateTimeout)
    updateTimeout = setTimeout(updatePreview, 100)
  }

  async function downloadPreviewPNG() {
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

  async function downloadPreviewSVG() {
    if (mode === 'single') {
      if (!urlPattern) return

      const { generateQR } = await import('../lib/qr-generation')

      const svgString = await generateQR({
        text: urlPattern,
        format: 'svg',
        options,
        tileLabel: labelEnabled ? labelPattern : undefined
      })

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${labelPattern || 'qr-code'}.svg`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } else if (csvData) {
      const { generateQR } = await import('../lib/qr-generation')
      const row = csvData.rows[previewIndex]
      const url = replaceVariables(urlPattern, row, previewIndex, csvData.rows.length)
      const label = replaceVariables(labelPattern, row, previewIndex, csvData.rows.length)

      const svgString = await generateQR({
        text: url,
        format: 'svg',
        options,
        tileLabel: labelEnabled ? label : undefined
      })

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const urlBlob = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${label || `qr-${previewIndex + 1}`}.svg`
      link.href = urlBlob
      link.click()
      URL.revokeObjectURL(urlBlob)
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
    // Trigger on option changes
    options.qr.padding?.top
    options.qr.padding?.right
    options.qr.padding?.bottom
    options.qr.padding?.left
    options.qr.size
    options.qr.errorCorrection
    options.logo.enabled
    options.logo.dataURL
    options.logo.size
    options.logo.width
    options.logo.height
    options.logo.fit
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
    urlPattern

    if (mode === 'single' && urlPattern) {
      debouncedUpdatePreview()
    } else if (mode === 'batch' && csvData && urlPattern) {
      debouncedUpdatePreview()
    } else {
      previewQR = ''
    }
  })

  $effect(() => {
    previewIndex
    csvData?.rows.length

    if (mode === 'batch' && csvData && urlPattern) {
      updatePreview()
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

            <div class="qr-preview-container relative overflow-hidden p-8" style="border-radius: 8px; border: 4px solid transparent; background: repeating-conic-gradient(#9ca3af 0% 25%, #6b7280 0% 50%) padding-box, linear-gradient(to bottom, hsl(var(--border)), hsl(var(--border) / 0.5)) border-box; background-size: {checkerSize}px {checkerSize}px, auto; background-position: 32px 32px, 0 0; box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.25);">
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

            <div class="space-y-1.5 text-[11px] leading-tight text-muted-foreground/70">
              {#if currentURL}
                <div class="space-y-0">
                  <p class="opacity-60">url</p>
                  <p class="break-all">{currentURL}</p>
                </div>
              {/if}

              {#if mode === 'batch' && csvData}
                {#each Object.entries(csvData.rows[previewIndex]) as [key, value]}
                  <div class="space-y-0">
                    <p class="opacity-60">{key}</p>
                    <p class="break-all">{value}</p>
                  </div>
                {/each}
              {/if}

              <div class="space-y-0">
                <p class="opacity-60">dimensions</p>
                <p>{options.qr.size}px × {options.qr.size}px ({checkerSize.toFixed(0)}px grid)</p>
              </div>

              <div class="space-y-0">
                <p class="opacity-60 flex items-center gap-1.5">
                  print
                  <InfoTooltip text={$_('tooltips.previewDpi')} />
                </p>
                <div class="flex items-center gap-1.5">
                  <span>{((options.qr.size / dpi) * 25.4).toFixed(1)}mm × {((options.qr.size / dpi) * 25.4).toFixed(1)}mm @</span>
                  <select
                    bind:value={dpi}
                    class="h-4 rounded border border-input bg-background px-1 text-[11px]"
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
              <div class="flex gap-2">
                <Button size="sm" onclick={downloadPreviewPNG} class="flex-1">
                  PNG
                </Button>
                <Button size="sm" onclick={downloadPreviewSVG} class="flex-1">
                  SVG
                </Button>
              </div>
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
