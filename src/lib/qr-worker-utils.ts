import JSZip from 'jszip'
import type { QRDesignOptions } from './config'
import type { CSVData } from '../types'
import { replaceVariables } from './csv-parser'
import { generateQR } from './qr-generation'

export interface QRGenerationProgress {
  current: number
  total: number
  percentage: number
  status: 'idle' | 'generating' | 'compressing' | 'completed' | 'error'
  message?: string
}

export class QRGeneratorManager {
  private progressCallback: ((progress: QRGenerationProgress) => void) | null = null
  private abortController: AbortController | null = null

  setProgressCallback(callback: (progress: QRGenerationProgress) => void) {
    this.progressCallback = callback
  }

  async generateBatch(
    csvData: CSVData,
    urlPattern: string,
    labelPattern: string,
    format: 'png' | 'svg',
    options: QRDesignOptions
  ): Promise<Blob> {
    this.abortController = new AbortController()

    // Prepare all items to generate
    const items = csvData.rows.map((row, i) => ({
      text: replaceVariables(urlPattern, row, i, csvData.rows.length),
      label: replaceVariables(labelPattern, row, i, csvData.rows.length),
      filename: format === 'png'
        ? `qr-${(i + 1).toString().padStart(3, '0')}.png`
        : `qr-${(i + 1).toString().padStart(3, '0')}.svg`
    }))

    const results: Array<{ filename: string; content: string | Blob }> = []
    const batchSize = 5 // Process 5 at a time to avoid blocking

    try {
      // Start generation
      this.progressCallback?.({
        current: 0,
        total: items.length,
        percentage: 0,
        status: 'generating',
        message: `Generating ${items.length} QR codes...`
      })

      for (let i = 0; i < items.length; i += batchSize) {
        if (this.abortController.signal.aborted) {
          throw new Error('Generation cancelled')
        }

        const batch = items.slice(i, Math.min(i + batchSize, items.length))

        const batchResults = await Promise.all(
          batch.map(async (item) => {
            const content = await generateQR({
              text: item.text,
              format,
              options,
              tileLabel: item.label
            })
            return { filename: item.filename, content }
          })
        )

        results.push(...batchResults)

        const current = Math.min(i + batchSize, items.length)
        this.progressCallback?.({
          current,
          total: items.length,
          percentage: Math.round((current / items.length) * 100),
          status: 'generating'
        })

        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // Update progress to compressing
      this.progressCallback?.({
        current: items.length,
        total: items.length,
        percentage: 100,
        status: 'compressing',
        message: 'Creating ZIP file...'
      })

      const zip = new JSZip()

      for (const result of results) {
        if (format === 'png') {
          const base64 = (result.content as string).split(',')[1]
          const binary = atob(base64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
          zip.file(result.filename, bytes)
        } else {
          zip.file(result.filename, result.content as string)
        }
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
        streamFiles: true
      })

      this.progressCallback?.({
        current: items.length,
        total: items.length,
        percentage: 100,
        status: 'completed'
      })

      return zipBlob
    } catch (error) {
      this.progressCallback?.({
        current: 0,
        total: items.length,
        percentage: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate QR codes'
      })
      throw error
    } finally {
      this.abortController = null
    }
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  destroy() {
    this.cancel()
  }
}