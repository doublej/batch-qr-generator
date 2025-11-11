import QRCode from 'qrcode'
import JSZip from 'jszip'
import jsPDF from 'jspdf'
import type { TileBatch, TileMapping } from './types'

interface QROptions {
  tileLabel: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logoDataURL?: string
  logoSize?: number
  textSize?: number
  textMargin?: number
  showTileLabel?: boolean
  qrSize?: number
  qrMargin?: number
}

export async function generateQRDataURL(text: string, options?: QROptions): Promise<string> {
  const qrSize = options?.qrSize || 300
  const canvas = document.createElement('canvas')

  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    width: qrSize,
    margin: options?.qrMargin ?? 4
  })

  if (options?.logoDataURL) {
    const ctx = canvas.getContext('2d')!
    const logo = new Image()
    await new Promise((resolve, reject) => {
      logo.onload = resolve
      logo.onerror = reject
      logo.src = options.logoDataURL!
    })

    const sizePercent = (options.logoSize || 25) / 100
    const logoSize = qrSize * sizePercent
    const logoX = (qrSize - logoSize) / 2
    const logoY = (qrSize - logoSize) / 2

    ctx.fillStyle = 'white'
    ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
  }

  if (!options || !options.showTileLabel) {
    return canvas.toDataURL()
  }

  const marginPercent = (options.textMargin || 20) / 100
  const margin = Math.floor(qrSize * marginPercent)
  const fontSize = options.textSize || 16
  const lineHeight = fontSize * 1.5

  const textHeight = lineHeight + margin
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
  const textY = qrSize + margin + margin + lineHeight * 0.8

  ctx.fillText(options.tileLabel, textX, textY)

  return finalCanvas.toDataURL()
}

export function getTileLabel(batchId: string, tileNumber: number, totalTiles: number): string {
  const paddedNumber = tileNumber.toString().padStart(3, '0')
  return `${paddedNumber}/${totalTiles}`
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
  totalTiles: number,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 25,
  textSize: number = 16,
  textMargin: number = 20,
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrMargin: number = 4
): Promise<void> {
  const url = getTileURL(tile.secure_id, baseURL)
  const tileLabel = getTileLabel(batchId, tile.tile_number, totalTiles)
  const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin })
  const blob = await (await fetch(dataUrl)).blob()
  const filename = `${batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.png`
  downloadFile(blob, filename)
}

export async function downloadAllQRs(
  batch: TileBatch,
  baseURL: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 25,
  textSize: number = 16,
  textMargin: number = 20,
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrMargin: number = 4
): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin })
    const blob = await (await fetch(dataUrl)).blob()
    const filename = `tile-${tile.tile_number.toString().padStart(3, '0')}.png`
    zip.file(filename, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `${batch.batchId}-qrcodes.zip`)
}

export async function downloadPrintPDF(
  batch: TileBatch,
  baseURL: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 25,
  textSize: number = 16,
  textMargin: number = 20,
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrMargin: number = 4,
  pageSize: 'A4' | 'A3' = 'A4'
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageSize.toLowerCase() as 'a4' | 'a3'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const qrSizeMM = 50
  const gap = 5
  const cols = Math.floor((pageWidth - 2 * margin + gap) / (qrSizeMM + gap))
  const rows = Math.floor((pageHeight - 2 * margin + gap) / (qrSizeMM + gap))
  const qrsPerPage = cols * rows

  let currentPage = 0
  let qrCount = 0

  for (const tile of batch.tiles) {
    if (qrCount % qrsPerPage === 0 && qrCount > 0) {
      pdf.addPage()
      currentPage++
    }

    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin })

    const posInPage = qrCount % qrsPerPage
    const col = posInPage % cols
    const row = Math.floor(posInPage / cols)

    const x = margin + col * (qrSizeMM + gap)
    const y = margin + row * (qrSizeMM + gap)

    pdf.addImage(dataUrl, 'PNG', x, y, qrSizeMM, qrSizeMM)
    qrCount++
  }

  pdf.save(`${batch.batchId}-print-${pageSize}.pdf`)
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
