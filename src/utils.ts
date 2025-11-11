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
  moduleShape?: 'square' | 'rounded' | 'dots'
  cornerRadius?: number
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
  ctx.fill()
}

export async function generateQRDataURL(text: string, options?: QROptions): Promise<string> {
  const qrSize = options?.qrSize || 300
  const moduleShape = options?.moduleShape || 'square'
  const canvas = document.createElement('canvas')

  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    width: qrSize,
    margin: options?.qrMargin ?? 4
  })

  if (moduleShape !== 'square') {
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixelSize = Math.ceil(qrSize / 100)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black'

    for (let y = 0; y < canvas.height; y += pixelSize) {
      for (let x = 0; x < canvas.width; x += pixelSize) {
        const i = (y * canvas.width + x) * 4
        if (imageData.data[i] < 128) {
          if (moduleShape === 'dots') {
            ctx.beginPath()
            ctx.arc(x + pixelSize / 2, y + pixelSize / 2, pixelSize / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (moduleShape === 'rounded') {
            const radius = (options?.cornerRadius ?? 30) / 100 * pixelSize
            drawRoundedRect(ctx, x, y, pixelSize, pixelSize, radius)
          }
        }
      }
    }
  }

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
  qrMargin: number = 4,
  moduleShape: 'square' | 'rounded' | 'dots' = 'square',
  cornerRadius: number = 30
): Promise<void> {
  const url = getTileURL(tile.secure_id, baseURL)
  const tileLabel = getTileLabel(batchId, tile.tile_number, totalTiles)
  const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin, moduleShape, cornerRadius })
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
  qrMargin: number = 4,
  moduleShape: 'square' | 'rounded' | 'dots' = 'square',
  cornerRadius: number = 30
): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin, moduleShape, cornerRadius })
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
  pageSize: 'A4' | 'A3' = 'A4',
  moduleShape: 'square' | 'rounded' | 'dots' = 'square',
  cornerRadius: number = 30
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
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin, moduleShape, cornerRadius })

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

export async function generateQRSVG(text: string, options?: QROptions): Promise<string> {
  const qrSize = options?.qrSize || 300

  let svgString = await QRCode.toString(text, {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    width: qrSize,
    margin: options?.qrMargin ?? 4,
    type: 'svg'
  })

  if (options?.logoDataURL) {
    const sizePercent = (options.logoSize || 25) / 100
    const logoSize = qrSize * sizePercent
    const logoX = (qrSize - logoSize) / 2
    const logoY = (qrSize - logoSize) / 2
    const padding = 5

    const logoRect = `<rect x="${logoX - padding}" y="${logoY - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="white"/>`
    const logoImage = `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${options.logoDataURL}"/>`

    svgString = svgString.replace('</svg>', `${logoRect}${logoImage}</svg>`)
  }

  if (!options || !options.showTileLabel) {
    return svgString
  }

  const marginPercent = (options.textMargin || 20) / 100
  const margin = Math.floor(qrSize * marginPercent)
  const fontSize = options.textSize || 16
  const lineHeight = fontSize * 1.5

  const textHeight = lineHeight + margin
  const finalWidth = qrSize + margin * 2
  const finalHeight = qrSize + margin * 2 + textHeight

  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
  const svgElement = svgDoc.querySelector('svg')

  if (!svgElement) return svgString

  const wrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${finalWidth} ${finalHeight}" width="${finalWidth}" height="${finalHeight}">
  <rect width="${finalWidth}" height="${finalHeight}" fill="white"/>
  <g transform="translate(${margin}, ${margin})">
    ${svgElement.innerHTML}
  </g>
  <text x="${finalWidth / 2}" y="${qrSize + margin + margin + lineHeight * 0.8}" font-family="system-ui, sans-serif" font-size="${fontSize}" text-anchor="middle" fill="black">${options.tileLabel}</text>
</svg>`

  return wrapper
}

export async function downloadQRSVG(
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
  const svg = await generateQRSVG(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin })
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const filename = `${batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.svg`
  downloadFile(blob, filename)
}

export async function downloadAllQRsSVG(
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
  moduleShape: 'square' | 'rounded' | 'dots' = 'square',
  cornerRadius: number = 30
): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const svg = await generateQRSVG(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin, moduleShape, cornerRadius })
    const filename = `tile-${tile.tile_number.toString().padStart(3, '0')}.svg`
    zip.file(filename, svg)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `${batch.batchId}-qrcodes-svg.zip`)
}
