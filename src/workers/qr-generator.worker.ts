import { generateQR } from '../lib/qr-generation'
import type { QRDesignOptions } from '../lib/config'

export type QRWorkerMessage =
  | {
      type: 'generate-batch'
      data: {
        items: Array<{ text: string; label: string; filename: string }>
        format: 'png' | 'svg'
        options: QRDesignOptions
        batchSize: number
      }
    }
  | { type: 'cancel' }

export type QRWorkerResponse =
  | {
      type: 'progress'
      data: {
        current: number
        total: number
        percentage: number
      }
    }
  | {
      type: 'result'
      data: {
        filename: string
        content: string
      }
    }
  | {
      type: 'complete'
      data: {
        results: Array<{ filename: string; content: string }>
      }
    }
  | {
      type: 'error'
      data: {
        message: string
      }
    }

let abortController: AbortController | null = null

self.addEventListener('message', async (event: MessageEvent<QRWorkerMessage>) => {
  const { type } = event.data

  if (type === 'cancel') {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    return
  }

  if (type === 'generate-batch') {
    abortController = new AbortController()
    const results: Array<{ filename: string; content: string }> = []
    const data = (event.data as Extract<QRWorkerMessage, { type: 'generate-batch' }>).data
    const { items, format, options, batchSize = 5 } = data

    try {
      // Process in chunks to avoid overwhelming the worker
      for (let i = 0; i < items.length; i += batchSize) {
        if (abortController.signal.aborted) {
          break
        }

        const chunk = items.slice(i, Math.min(i + batchSize, items.length))

        // Generate QRs in parallel within each chunk
        const chunkPromises = chunk.map(async (item) => {
          const content = await generateQR({
            text: item.text,
            format,
            options,
            tileLabel: item.label
          })
          return { filename: item.filename, content }
        })

        const chunkResults = await Promise.all(chunkPromises)
        results.push(...chunkResults)

        // Send individual results as they complete
        for (const result of chunkResults) {
          self.postMessage({
            type: 'result',
            data: result
          } as QRWorkerResponse)
        }

        // Send progress update
        self.postMessage({
          type: 'progress',
          data: {
            current: Math.min(i + batchSize, items.length),
            total: items.length,
            percentage: Math.round((Math.min(i + batchSize, items.length) / items.length) * 100)
          }
        } as QRWorkerResponse)
      }

      if (!abortController.signal.aborted) {
        self.postMessage({
          type: 'complete',
          data: { results }
        } as QRWorkerResponse)
      }
    } catch (error) {
      self.postMessage({
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      } as QRWorkerResponse)
    } finally {
      abortController = null
    }
  }
})