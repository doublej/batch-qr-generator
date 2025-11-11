import QRCode from 'qrcode'
import JSZip from 'jszip'
import type { TileBatch, TileMapping } from './types'

interface QROptions {
  tileLabel: string
  prefixText: string
  suffixText: string
}

export async function generateQRDataURL(text: string, options?: QROptions): Promise<string> {
  const qrSize = 300
  const canvas = document.createElement('canvas')

  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'M',
    width: qrSize,
    margin: 0
  })

  if (!options) {
    return canvas.toDataURL()
  }

  const margin = Math.floor(qrSize * 0.2)
  const fontSize = 16
  const lineHeight = 24
  const textLines = [
    options.prefixText,
    options.tileLabel,
    options.suffixText
  ].filter(line => line.trim())

  const textHeight = textLines.length * lineHeight + margin
  const finalWidth = qrSize + margin * 2
  const finalHeight = qrSize + margin * 2 + textHeight

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = finalWidth
  finalCanvas.height = finalHeight

  const ctx = finalCanvas.getContext('2d')!
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, finalWidth, finalHeight)

  ctx.drawImage(canvas, margin, margin)

  ctx.fillStyle = 'black'
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textAlign = 'center'

  const textX = finalWidth / 2
  let textY = qrSize + margin + margin + lineHeight

  textLines.forEach(line => {
    ctx.fillText(line, textX, textY)
    textY += lineHeight
  })

  return finalCanvas.toDataURL()
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

export async function downloadQR(
  tile: TileMapping,
  batchId: string,
  baseURL: string,
  prefixText: string,
  suffixText: string
): Promise<void> {
  const url = getTileURL(tile.secure_id, baseURL)
  const tileLabel = getTileLabel(batchId, tile.tile_number)
  const dataUrl = await generateQRDataURL(url, { tileLabel, prefixText, suffixText })
  const blob = await (await fetch(dataUrl)).blob()
  const filename = `${batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.png`
  downloadFile(blob, filename)
}

export async function downloadAllQRs(
  batch: TileBatch,
  baseURL: string,
  prefixText: string,
  suffixText: string
): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number)
    const dataUrl = await generateQRDataURL(url, { tileLabel, prefixText, suffixText })
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
