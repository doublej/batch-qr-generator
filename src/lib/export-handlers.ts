import JSZip from 'jszip'
import type { TileBatch } from '../types'
import type { QRDesignOptions } from './config'
import { generateQR } from './qr-generation'

export function getTileLabel(batchId: string, tileNumber: number, totalTiles: number): string {
  const paddedNumber = tileNumber.toString().padStart(3, '0')
  return `${paddedNumber}/${totalTiles}`
}

export function getTileURL(secureId: string, baseURL: string): string {
  return `${baseURL}${secureId}`
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadAllQRs(
  batch: TileBatch,
  baseURL: string,
  options: QRDesignOptions,
  format: 'png' | 'svg'
): Promise<void> {
  const zip = new JSZip()
  const extension = format === 'png' ? 'png' : 'svg'

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const qrData = await generateQR({ text: url, format, options, tileLabel })

    if (format === 'png') {
      const blob = await (await fetch(qrData)).blob()
      zip.file(`entry-${tile.tile_number.toString().padStart(3, '0')}.${extension}`, blob)
    } else {
      zip.file(`entry-${tile.tile_number.toString().padStart(3, '0')}.${extension}`, qrData)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `${batch.batchId}-qrcodes-${extension}.zip`)
}

export function downloadCSV(batch: TileBatch): void {
  const rows = [
    ['entry_number', 'secure_id', 'status'],
    ...batch.tiles.map(tile => [
      tile.tile_number.toString(),
      tile.secure_id,
      tile.status
    ])
  ]

  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadFile(blob, `${batch.batchId}-entries.csv`)
}
