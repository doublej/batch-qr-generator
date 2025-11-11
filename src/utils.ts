import QRCode from 'qrcode'
import JSZip from 'jszip'
import type { TileBatch, TileMapping } from './types'

export async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2
  })
}

export function getTileLabel(batchId: string, tileNumber: number): string {
  return `drop ${batchId} - tile ${tileNumber.toString().padStart(3, '0')}`
}

export function getTileURL(secureId: string, baseURL: string): string {
  return `${baseURL}${secureId}`
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadQR(tile: TileMapping, batchId: string, baseURL: string): Promise<void> {
  const url = getTileURL(tile.secure_id, baseURL)
  const dataUrl = await generateQRDataURL(url)
  const blob = await (await fetch(dataUrl)).blob()
  const filename = `${batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.png`
  downloadFile(blob, filename)
}

export async function downloadAllQRs(batch: TileBatch, baseURL: string): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const dataUrl = await generateQRDataURL(url)
    const blob = await (await fetch(dataUrl)).blob()
    const filename = `tile-${tile.tile_number.toString().padStart(3, '0')}.png`
    zip.file(filename, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `${batch.batchId}-qrcodes.zip`)
}

export function downloadCSV(batch: TileBatch, baseURL: string): void {
  const rows = [
    ['Tile Number', 'Secure ID', 'URL'],
    ...batch.tiles.map(tile => [
      tile.tile_number.toString(),
      tile.secure_id,
      getTileURL(tile.secure_id, baseURL)
    ])
  ]

  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadFile(blob, `${batch.batchId}-tiles.csv`)
}
