import QRCodeStyling from 'qr-code-styling'
import JSZip from 'jszip'
import jsPDF from 'jspdf'
import type { TileBatch, TileMapping, CSVData } from './types'
import { replaceVariables } from './lib/csv-parser'

import type { QRPadding } from './lib/config'


function applyPaddingToCanvas(canvas: HTMLCanvasElement, padding: QRPadding): HTMLCanvasElement {
  if (padding.top === 0 && padding.right === 0 && padding.bottom === 0 && padding.left === 0) {
    return canvas
  }

  // Use full canvas dimensions, no content detection
  const contentWidth = canvas.width
  const contentHeight = canvas.height

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = contentWidth + padding.left + padding.right
  finalCanvas.height = contentHeight + padding.top + padding.bottom

  const ctx = finalCanvas.getContext('2d')!
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

  // Draw the entire canvas with padding
  ctx.drawImage(
    canvas,
    0, 0, contentWidth, contentHeight,
    padding.left, padding.top, contentWidth, contentHeight
  )

  return finalCanvas
}

function applyPaddingToSVG(svgString: string, padding: QRPadding): string {
  if (padding.top === 0 && padding.right === 0 && padding.bottom === 0 && padding.left === 0) {
    return svgString
  }

  const widthMatch = svgString.match(/width="([^"]+)"/)
  const heightMatch = svgString.match(/height="([^"]+)"/)

  if (!widthMatch || !heightMatch) return svgString

  const width = Number(widthMatch[1])
  const height = Number(heightMatch[1])

  const newWidth = width + padding.left + padding.right
  const newHeight = height + padding.top + padding.bottom

  // Extract inner SVG content while removing any XML declarations
  const innerSvg = svgString
    .replace(/<\?xml[^?]*\?>/g, '') // Remove any XML declarations
    .replace(/<svg[^>]*>/, '')       // Remove opening SVG tag
    .replace('</svg>', '')            // Remove closing SVG tag
    .trim()                           // Clean up whitespace

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${newWidth} ${newHeight}" width="${newWidth}" height="${newHeight}">
  <rect width="${newWidth}" height="${newHeight}" fill="white"/>
  <g transform="translate(${padding.left}, ${padding.top})">
    ${innerSvg}
  </g>
</svg>`
}

interface QROptions {
  tileLabel: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logoDataURL?: string
  logoSize?: number
  logoPlacement?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  textSize?: number
  textPosition?: 'top' | 'bottom' | 'left' | 'right'
  textOffsetX?: number
  textOffsetY?: number
  showTileLabel?: boolean
  textAlign?: 'left' | 'center' | 'right'
  textFont?: string
  textWeight?: 'normal' | 'bold'
  textColor?: string
  textRotation?: number
  qrSize?: number
  qrPadding?: QRPadding
  moduleShape?: 'square' | 'dots'
  eyeShape?: 'square' | 'dots'
  backgroundColor?: string
  eyeColor?: string
  dataModuleColor?: string
  useGradient?: boolean
  gradientType?: 'linear' | 'radial'
  gradientStart?: string
  gradientEnd?: string
  gradientAngle?: number
}


export async function generateQRDataURL(text: string, options?: QROptions): Promise<string> {
  const qrSize = options?.qrSize || 300
  const padding = options?.qrPadding ?? { top: 16, right: 16, bottom: 16, left: 16 }
  const moduleShape = options?.moduleShape || 'square'
  const useGradient = options?.useGradient || false

  const dotsColor = useGradient ? {
    type: options?.gradientType || 'linear',
    rotation: (options?.gradientAngle ?? 0) * Math.PI / 180,
    colorStops: [
      { offset: 0, color: options?.gradientStart || '#000000' },
      { offset: 1, color: options?.gradientEnd || '#666666' }
    ]
  } : options?.dataModuleColor || '#000000'

  const logoPlacement = options?.logoPlacement || 'center'
  const shouldCenterLogo = logoPlacement === 'center'

  const qrCode = new QRCodeStyling({
    width: qrSize,
    height: qrSize,
    type: 'canvas',
    data: text,
    image: shouldCenterLogo ? (options?.logoDataURL || undefined) : undefined,
    margin: 0,
    qrOptions: {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: (options?.logoSize || 60) / qrSize,
      margin: 5
    },
    dotsOptions: {
      color: dotsColor as any,
      type: moduleShape
    },
    cornersSquareOptions: {
      color: options?.eyeColor || '#000000',
      type: moduleShape
    },
    cornersDotOptions: {
      color: options?.eyeColor || '#000000',
      type: moduleShape
    },
    backgroundOptions: {
      color: options?.backgroundColor || '#FFFFFF'
    }
  })

  const canvas = document.createElement('canvas')
  await qrCode.getRawData('png').then(blob => {
    if (!blob) throw new Error('Failed to generate QR code')
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          canvas.width = qrSize
          canvas.height = qrSize
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)

          if (!shouldCenterLogo && options?.logoDataURL) {
            const logoImg = new Image()
            logoImg.onload = () => {
              let logoSize = options.logoSize || 60

              // Ensure logo size doesn't exceed QR size
              const maxLogoSize = qrSize * 0.3 // Max 30% of QR size
              logoSize = Math.min(logoSize, maxLogoSize)

              // Fixed margin from edges (sufficient to avoid eye patterns)
              const edgeMargin = 15

              // Calculate position ensuring logo stays within QR bounds
              let logoX = 0
              let logoY = 0

              if (logoPlacement === 'top-left') {
                logoX = edgeMargin
                logoY = edgeMargin
              } else if (logoPlacement === 'top-right') {
                logoX = Math.max(edgeMargin, qrSize - logoSize - edgeMargin)
                logoY = edgeMargin
              } else if (logoPlacement === 'bottom-left') {
                logoX = edgeMargin
                logoY = Math.max(edgeMargin, qrSize - logoSize - edgeMargin)
              } else if (logoPlacement === 'bottom-right') {
                logoX = Math.max(edgeMargin, qrSize - logoSize - edgeMargin)
                logoY = Math.max(edgeMargin, qrSize - logoSize - edgeMargin)
              }

              // Final boundary check to absolutely ensure logo stays within canvas
              logoX = Math.max(0, Math.min(logoX, qrSize - logoSize))
              logoY = Math.max(0, Math.min(logoY, qrSize - logoSize))

              ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
              resolve()
            }
            logoImg.onerror = reject
            logoImg.src = options.logoDataURL
          } else {
            resolve()
          }
        }
        img.onerror = reject
        img.src = reader.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  })

  let finalCanvas = canvas

  if (options && options.showTileLabel) {
    const textSpacing = 10
    const fontSize = options.textSize || 16
    const lineHeight = fontSize * 1.5
    const textPosition = options.textPosition || 'bottom'
    const textAlign = options.textAlign || 'center'
    const textFont = options.textFont || 'system-ui'
    const textWeight = options.textWeight || 'normal'
    const textColor = options.textColor || '#000000'
    const textRotation = options.textRotation || 0
    const offsetX = options.textOffsetX || 0
    const offsetY = options.textOffsetY || 0
    const isHorizontal = textPosition === 'left' || textPosition === 'right'

    const textSpace = lineHeight + textSpacing
    const finalWidth = isHorizontal ? qrSize + qrSize : qrSize
    const finalHeight = isHorizontal ? qrSize : qrSize + textSpace

    const textCanvas = document.createElement('canvas')
    textCanvas.width = finalWidth
    textCanvas.height = finalHeight

    const textCtx = textCanvas.getContext('2d')!
    textCtx.fillStyle = 'white'
    textCtx.fillRect(0, 0, finalWidth, finalHeight)

    const qrX = isHorizontal && textPosition === 'left' ? qrSize : 0
    const qrY = textPosition === 'top' ? textSpace : 0
    textCtx.drawImage(canvas, qrX, qrY)

    textCtx.fillStyle = textColor
    textCtx.font = `${textWeight} ${fontSize}px ${textFont}, sans-serif`
    textCtx.textAlign = textAlign

    let textX = offsetX
    let textY = lineHeight * 0.8 + offsetY

    if (textPosition === 'bottom') {
      textY = qrSize + textSpacing + lineHeight * 0.8 + offsetY
    } else if (textPosition === 'right') {
      textX = qrSize + offsetX
      textY = qrSize / 2 + offsetY
    } else if (textPosition === 'left') {
      textX = qrSize / 2 + offsetX
      textY = qrSize / 2 + offsetY
    }

    if (textAlign === 'center') textX = finalWidth / 2 + offsetX
    if (textAlign === 'right' && !isHorizontal) textX = finalWidth + offsetX

    if (textRotation !== 0) {
      textCtx.save()
      textCtx.translate(textX, textY)
      textCtx.rotate((textRotation * Math.PI) / 180)
      textCtx.fillText(options.tileLabel, 0, 0)
      textCtx.restore()
    } else {
      textCtx.fillText(options.tileLabel, textX, textY)
    }

    finalCanvas = textCanvas
  }

  finalCanvas = applyPaddingToCanvas(finalCanvas, padding)
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
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  moduleShape: 'square' | 'dots' = 'square'
): Promise<void> {
  const url = getTileURL(tile.secure_id, baseURL)
  const tileLabel = getTileLabel(batchId, tile.tile_number, totalTiles)
  const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })
  const blob = await (await fetch(dataUrl)).blob()
  const filename = `${batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.png`
  downloadFile(blob, filename)
}

export async function downloadAllQRs(
  batch: TileBatch,
  baseURL: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  moduleShape: 'square' | 'dots' = 'square'
): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })
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
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  pageSize: 'A4' | 'A3' = 'A4',
  moduleShape: 'square' | 'dots' = 'square'
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
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })

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

export function downloadCSV(batch: TileBatch): void {
  const rows = [
    ['tile_number', 'secure_id', 'status'],
    ...batch.tiles.map(tile => [
      tile.tile_number.toString(),
      tile.secure_id,
      tile.status
    ])
  ]

  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadFile(blob, `${batch.batchId}-tiles.csv`)
}

export async function generateQRSVG(text: string, options?: QROptions): Promise<string> {
  const qrSize = options?.qrSize || 300
  const padding = options?.qrPadding ?? { top: 16, right: 16, bottom: 16, left: 16 }
  const moduleShape = options?.moduleShape || 'square'
  const useGradient = options?.useGradient || false
  const logoPlacement = options?.logoPlacement || 'center'
  const shouldCenterLogo = logoPlacement === 'center'

  const dotsColor = useGradient ? {
    type: options?.gradientType || 'linear',
    rotation: (options?.gradientAngle ?? 0) * Math.PI / 180,
    colorStops: [
      { offset: 0, color: options?.gradientStart || '#000000' },
      { offset: 1, color: options?.gradientEnd || '#666666' }
    ]
  } : options?.dataModuleColor || '#000000'

  const qrCode = new QRCodeStyling({
    width: qrSize,
    height: qrSize,
    type: 'svg',
    data: text,
    image: shouldCenterLogo ? (options?.logoDataURL || undefined) : undefined,
    margin: 0,
    qrOptions: {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: (options?.logoSize || 60) / qrSize,
      margin: 5
    },
    dotsOptions: {
      color: dotsColor as any,
      type: moduleShape
    },
    cornersSquareOptions: {
      color: options?.eyeColor || '#000000',
      type: moduleShape
    },
    cornersDotOptions: {
      color: options?.eyeColor || '#000000',
      type: moduleShape
    },
    backgroundOptions: {
      color: options?.backgroundColor || '#FFFFFF'
    }
  })

  const blob = await qrCode.getRawData('svg')
  if (!blob) throw new Error('Failed to generate QR SVG')

  let svgString = await blob.text()

  if (!shouldCenterLogo && options?.logoDataURL) {
    const logoSize = options.logoSize || 60
    let logoX = 0
    let logoY = 0

    if (logoPlacement === 'top-left') {
      logoX = 10
      logoY = 10
    } else if (logoPlacement === 'top-right') {
      logoX = qrSize - logoSize - 10
      logoY = 10
    } else if (logoPlacement === 'bottom-left') {
      logoX = 10
      logoY = qrSize - logoSize - 10
    }

    svgString = svgString.replace('</svg>', `<image href="${options.logoDataURL}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/></svg>`)
  }

  let finalSvg = svgString

  if (options && options.showTileLabel) {
    const textSpacing = 10
    const fontSize = options.textSize || 16
    const lineHeight = fontSize * 1.5
    const textPosition = options.textPosition || 'bottom'
    const textAlign = options.textAlign || 'center'
    const textFont = options.textFont || 'system-ui'
    const textWeight = options.textWeight || 'normal'
    const textColor = options.textColor || '#000000'
    const textRotation = options.textRotation || 0
    const offsetX = options.textOffsetX || 0
    const offsetY = options.textOffsetY || 0
    const isHorizontal = textPosition === 'left' || textPosition === 'right'

    const textSpace = lineHeight + textSpacing
    const finalWidth = isHorizontal ? qrSize + qrSize : qrSize
    const finalHeight = isHorizontal ? qrSize : qrSize + textSpace

    // Extract inner SVG content while removing any XML declarations
  const innerSvg = svgString
    .replace(/<\?xml[^?]*\?>/g, '') // Remove any XML declarations
    .replace(/<svg[^>]*>/, '')       // Remove opening SVG tag
    .replace('</svg>', '')            // Remove closing SVG tag
    .trim()                           // Clean up whitespace

    const qrX = isHorizontal && textPosition === 'left' ? qrSize : 0
    const qrY = textPosition === 'top' ? textSpace : 0

    let textX = offsetX
    let textY = lineHeight * 0.8 + offsetY

    if (textPosition === 'bottom') {
      textY = qrSize + textSpacing + lineHeight * 0.8 + offsetY
    } else if (textPosition === 'right') {
      textX = qrSize + offsetX
      textY = qrSize / 2 + offsetY
    } else if (textPosition === 'left') {
      textX = qrSize / 2 + offsetX
      textY = qrSize / 2 + offsetY
    }

    let textAnchor = 'start'
    if (textAlign === 'center') {
      textX = finalWidth / 2 + offsetX
      textAnchor = 'middle'
    } else if (textAlign === 'right' && !isHorizontal) {
      textX = finalWidth + offsetX
      textAnchor = 'end'
    }

    const fontWeightAttr = textWeight === 'bold' ? 'font-weight="bold"' : ''
    const rotateAttr = textRotation !== 0 ? `transform="rotate(${textRotation} ${textX} ${textY})"` : ''

    finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${finalWidth} ${finalHeight}" width="${finalWidth}" height="${finalHeight}">
  <rect width="${finalWidth}" height="${finalHeight}" fill="white"/>
  <g transform="translate(${qrX}, ${qrY})">
    ${innerSvg}
  </g>
  <text x="${textX}" y="${textY}" font-family="${textFont}, sans-serif" font-size="${fontSize}" ${fontWeightAttr} text-anchor="${textAnchor}" fill="${textColor}" ${rotateAttr}>${options.tileLabel}</text>
</svg>`
  }

  return applyPaddingToSVG(finalSvg, padding)
}

export async function downloadQRSVG(
  tile: TileMapping,
  batchId: string,
  baseURL: string,
  totalTiles: number,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 }
): Promise<void> {
  const url = getTileURL(tile.secure_id, baseURL)
  const tileLabel = getTileLabel(batchId, tile.tile_number, totalTiles)
  const svg = await generateQRSVG(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding })
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const filename = `${batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.svg`
  downloadFile(blob, filename)
}

export async function downloadAllQRsSVG(
  batch: TileBatch,
  baseURL: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  moduleShape: 'square' | 'dots' = 'square'
): Promise<void> {
  const zip = new JSZip()

  for (const tile of batch.tiles) {
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const svg = await generateQRSVG(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })
    const filename = `tile-${tile.tile_number.toString().padStart(3, '0')}.svg`
    zip.file(filename, svg)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `${batch.batchId}-qrcodes-svg.zip`)
}

export async function downloadAllQRsFromCSV(
  csvData: CSVData,
  urlPattern: string,
  labelPattern: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  moduleShape: 'square' | 'dots' = 'square'
): Promise<void> {
  const zip = new JSZip()

  for (let i = 0; i < csvData.rows.length; i++) {
    const row = csvData.rows[i]
    const url = replaceVariables(urlPattern, row, i, csvData.rows.length)
    const tileLabel = replaceVariables(labelPattern, row, i, csvData.rows.length)
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })
    const blob = await (await fetch(dataUrl)).blob()
    const filename = `qr-${(i + 1).toString().padStart(3, '0')}.png`
    zip.file(filename, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `qrcodes.zip`)
}

export async function downloadAllQRsSVGFromCSV(
  csvData: CSVData,
  urlPattern: string,
  labelPattern: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  moduleShape: 'square' | 'dots' = 'square'
): Promise<void> {
  const zip = new JSZip()

  for (let i = 0; i < csvData.rows.length; i++) {
    const row = csvData.rows[i]
    const url = replaceVariables(urlPattern, row, i, csvData.rows.length)
    const tileLabel = replaceVariables(labelPattern, row, i, csvData.rows.length)
    const svg = await generateQRSVG(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })
    const filename = `qr-${(i + 1).toString().padStart(3, '0')}.svg`
    zip.file(filename, svg)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadFile(zipBlob, `qrcodes-svg.zip`)
}

export async function downloadPrintPDFFromCSV(
  csvData: CSVData,
  urlPattern: string,
  labelPattern: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  logoDataURL: string = '',
  logoSize: number = 60,
  logoPlacement: 'center' | 'top-left' | 'top-right' | 'bottom-left' = 'center',
  textSize: number = 16,
  textPosition: 'top' | 'bottom' = 'bottom',
  showTileLabel: boolean = true,
  qrSize: number = 300,
  qrPadding: QRPadding = { top: 16, right: 16, bottom: 16, left: 16 },
  pageSize: 'A4' | 'A3' = 'A4',
  moduleShape: 'square' | 'dots' = 'square'
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: (pageSize.toLowerCase() as any)
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

  for (let i = 0; i < csvData.rows.length; i++) {
    const row = csvData.rows[i]
    if (qrCount % qrsPerPage === 0 && qrCount > 0) {
      pdf.addPage()
      currentPage++
    }

    const url = replaceVariables(urlPattern, row, i, csvData.rows.length)
    const tileLabel = replaceVariables(labelPattern, row, i, csvData.rows.length)
    const dataUrl = await generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, logoPlacement, textSize, textPosition, showTileLabel, qrSize, qrPadding, moduleShape })

    const posInPage = qrCount % qrsPerPage
    const col = posInPage % cols
    const rowIdx = Math.floor(posInPage / cols)

    const x = margin + col * (qrSizeMM + gap)
    const y = margin + rowIdx * (qrSizeMM + gap)

    pdf.addImage(dataUrl, 'PNG', x, y, qrSizeMM, qrSizeMM)
    qrCount++
  }

  pdf.save(`qrcodes-print-${pageSize}.pdf`)
}

export function downloadCSVData(
  csvData: CSVData,
  urlPattern: string,
  labelPattern: string,
  filename: string = 'data.csv'
): void {
  const headers = [...csvData.headers, 'qr_url', 'qr_label', 'total_rows']

  const rows = [
    headers,
    ...csvData.rows.map((row, idx) => [
      ...csvData.headers.map(h => row[h] || ''),
      replaceVariables(urlPattern, row, idx, csvData.rows.length),
      replaceVariables(labelPattern, row, idx, csvData.rows.length),
      String(csvData.rows.length)
    ])
  ]

  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  downloadFile(blob, filename)
}
