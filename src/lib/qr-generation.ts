import QRCodeStyling from 'qr-code-styling'
import type { QRDesignOptions, QRPadding } from './config'
import { calculateLogoPosition } from './logo-utils'
import { getEstimatedModuleCount, getPixelsPerModule } from './qr-dimensions'

interface GenerateQRParams {
  text: string
  format: 'png' | 'svg'
  options: QRDesignOptions
  tileLabel?: string
}

function createQRConfig(text: string, options: QRDesignOptions, format: 'canvas' | 'svg') {
  const { qr, logo, colors, gradient } = options
  const shouldCenterLogo = logo.placement === 'center'

  const dotsColor = gradient.enabled ? {
    type: gradient.type,
    rotation: (gradient.angle ?? 0) * Math.PI / 180,
    colorStops: [
      { offset: 0, color: gradient.start },
      { offset: 1, color: gradient.end }
    ]
  } : colors.dataModuleColor

  return new QRCodeStyling({
    width: qr.size,
    height: qr.size,
    type: format,
    data: text,
    image: shouldCenterLogo && logo.enabled ? logo.dataURL || undefined : undefined,
    margin: 0,
    qrOptions: {
      errorCorrectionLevel: qr.errorCorrection
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: logo.size / qr.size,
      margin: 5
    },
    dotsOptions: {
      color: dotsColor as any,
      type: qr.moduleShape
    },
    cornersSquareOptions: {
      color: colors.eyeColor,
      type: qr.moduleShape
    },
    cornersDotOptions: {
      color: colors.eyeColor,
      type: qr.moduleShape
    },
    backgroundOptions: {
      color: colors.background
    }
  })
}

async function addNonCenterLogo(
  canvas: HTMLCanvasElement,
  logoDataURL: string,
  logoSize: number,
  placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  qrSize: number
): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const logoImg = new Image()

  return new Promise((resolve, reject) => {
    logoImg.onload = () => {
      const { x, y } = calculateLogoPosition(placement, qrSize, logoSize)
      ctx.drawImage(logoImg, x, y, logoSize, logoSize)
      resolve()
    }
    logoImg.onerror = reject
    logoImg.src = logoDataURL
  })
}

function calculateContentBounds(qrSize: number) {
  // Estimate the module count based on QR size
  const moduleCount = getEstimatedModuleCount(qrSize)
  const pixelsPerModule = getPixelsPerModule(qrSize, moduleCount)

  // Calculate the actual QR code size (modules * pixels per module)
  const actualQRSize = moduleCount * pixelsPerModule

  // Calculate the offset (centered in the canvas)
  const offset = Math.floor((qrSize - actualQRSize) / 2)

  return {
    minX: offset,
    maxX: offset + actualQRSize - 1,
    minY: offset,
    maxY: offset + actualQRSize - 1
  }
}

function applyPadding(canvas: HTMLCanvasElement, padding: QRPadding, backgroundColor: string): HTMLCanvasElement {
  if (padding.top === 0 && padding.right === 0 && padding.bottom === 0 && padding.left === 0) {
    return canvas
  }

  const bounds = calculateContentBounds(canvas.width)
  const contentWidth = bounds.maxX - bounds.minX + 1
  const contentHeight = bounds.maxY - bounds.minY + 1

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = contentWidth + padding.left + padding.right
  finalCanvas.height = contentHeight + padding.top + padding.bottom

  const ctx = finalCanvas.getContext('2d')!
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

  ctx.drawImage(
    canvas,
    bounds.minX, bounds.minY, contentWidth, contentHeight,
    padding.left, padding.top, contentWidth, contentHeight
  )

  return finalCanvas
}

function addTextLabel(
  canvas: HTMLCanvasElement,
  label: string,
  qrSize: number,
  textConfig: QRDesignOptions['text'],
  backgroundColor: string
): HTMLCanvasElement {
  const lineHeight = textConfig.size * 1.5
  const textSpacing = 10
  const isHorizontal = textConfig.position === 'left' || textConfig.position === 'right'

  const textSpace = lineHeight + textSpacing
  const finalWidth = isHorizontal ? qrSize + qrSize : qrSize
  const finalHeight = isHorizontal ? qrSize : qrSize + textSpace

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = finalWidth
  finalCanvas.height = finalHeight

  const ctx = finalCanvas.getContext('2d')!
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, finalWidth, finalHeight)

  const qrX = isHorizontal && textConfig.position === 'left' ? qrSize : 0
  const qrY = textConfig.position === 'top' ? textSpace : 0
  ctx.drawImage(canvas, qrX, qrY)

  ctx.fillStyle = textConfig.color
  ctx.font = `${textConfig.weight} ${textConfig.size}px ${textConfig.font}, sans-serif`
  ctx.textAlign = textConfig.align

  let textX = textConfig.offsetX
  let textY = lineHeight * 0.8 + textConfig.offsetY

  if (textConfig.position === 'bottom') {
    textY = qrSize + textSpacing + lineHeight * 0.8 + textConfig.offsetY
  } else if (textConfig.position === 'right') {
    textX = qrSize + textConfig.offsetX
    textY = qrSize / 2 + textConfig.offsetY
  } else if (textConfig.position === 'left') {
    textX = qrSize / 2 + textConfig.offsetX
    textY = qrSize / 2 + textConfig.offsetY
  }

  if (textConfig.align === 'center') textX = finalWidth / 2 + textConfig.offsetX
  if (textConfig.align === 'right' && !isHorizontal) textX = finalWidth + textConfig.offsetX

  if (textConfig.rotation !== 0) {
    ctx.save()
    ctx.translate(textX, textY)
    ctx.rotate((textConfig.rotation * Math.PI) / 180)
    ctx.fillText(label, 0, 0)
    ctx.restore()
  } else {
    ctx.fillText(label, textX, textY)
  }

  return finalCanvas
}

async function generatePNG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  const qrCode = createQRConfig(text, options, 'canvas')
  const blob = await qrCode.getRawData('png')
  if (!blob) throw new Error('Failed to generate QR code')

  const canvas = document.createElement('canvas')
  canvas.width = options.qr.size
  canvas.height = options.qr.size

  await new Promise<void>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        resolve()
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(blob as Blob)
  })

  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    await addNonCenterLogo(
      canvas,
      options.logo.dataURL,
      options.logo.size,
      options.logo.placement as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      options.qr.size
    )
  }

  let finalCanvas = tileLabel && options.text.enabled
    ? addTextLabel(canvas, tileLabel, options.qr.size, options.text, options.colors.background)
    : canvas

  finalCanvas = applyPadding(finalCanvas, {
    top: Math.floor(options.qr.padding.top),
    right: Math.floor(options.qr.padding.right),
    bottom: Math.floor(options.qr.padding.bottom),
    left: Math.floor(options.qr.padding.left)
  }, options.colors.background)

  return finalCanvas.toDataURL()
}

function applySVGPadding(svgString: string, padding: QRPadding, backgroundColor: string): string {
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
  <rect width="${newWidth}" height="${newHeight}" fill="${backgroundColor}"/>
  <g transform="translate(${padding.left}, ${padding.top})">
    ${innerSvg}
  </g>
</svg>`
}

async function generateSVG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  const qrCode = createQRConfig(text, options, 'svg')
  const blob = await qrCode.getRawData('svg')
  if (!blob) throw new Error('Failed to generate QR SVG')

  let svgString = await (blob as Blob).text()

  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    const { x, y } = calculateLogoPosition(
      options.logo.placement as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      options.qr.size,
      options.logo.size
    )
    svgString = svgString.replace(
      '</svg>',
      `<image href="${options.logo.dataURL}" x="${x}" y="${y}" width="${options.logo.size}" height="${options.logo.size}"/></svg>`
    )
  }

  if (!tileLabel || !options.text.enabled) {
    return applySVGPadding(svgString, {
      top: Math.floor(options.qr.padding.top),
      right: Math.floor(options.qr.padding.right),
      bottom: Math.floor(options.qr.padding.bottom),
      left: Math.floor(options.qr.padding.left)
    }, options.colors.background)
  }

  const lineHeight = options.text.size * 1.5
  const textSpacing = 10
  const isHorizontal = options.text.position === 'left' || options.text.position === 'right'

  const textSpace = lineHeight + textSpacing
  const finalWidth = isHorizontal ? options.qr.size + options.qr.size : options.qr.size
  const finalHeight = isHorizontal ? options.qr.size : options.qr.size + textSpace

  // Extract inner SVG content while removing any XML declarations
  const innerSvg = svgString
    .replace(/<\?xml[^?]*\?>/g, '') // Remove any XML declarations
    .replace(/<svg[^>]*>/, '')       // Remove opening SVG tag
    .replace('</svg>', '')            // Remove closing SVG tag
    .trim()                           // Clean up whitespace
  const qrX = isHorizontal && options.text.position === 'left' ? options.qr.size : 0
  const qrY = options.text.position === 'top' ? textSpace : 0

  let textX = options.text.offsetX
  let textY = lineHeight * 0.8 + options.text.offsetY

  if (options.text.position === 'bottom') {
    textY = options.qr.size + textSpacing + lineHeight * 0.8 + options.text.offsetY
  } else if (options.text.position === 'right') {
    textX = options.qr.size + options.text.offsetX
    textY = options.qr.size / 2 + options.text.offsetY
  } else if (options.text.position === 'left') {
    textX = options.qr.size / 2 + options.text.offsetX
    textY = options.qr.size / 2 + options.text.offsetY
  }

  let textAnchor = 'start'
  if (options.text.align === 'center') {
    textX = finalWidth / 2 + options.text.offsetX
    textAnchor = 'middle'
  } else if (options.text.align === 'right' && !isHorizontal) {
    textX = finalWidth + options.text.offsetX
    textAnchor = 'end'
  }

  const fontWeightAttr = options.text.weight === 'bold' ? 'font-weight="bold"' : ''
  const rotateAttr = options.text.rotation !== 0
    ? `transform="rotate(${options.text.rotation} ${textX} ${textY})"`
    : ''

  const svgWithText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${finalWidth} ${finalHeight}" width="${finalWidth}" height="${finalHeight}">
  <rect width="${finalWidth}" height="${finalHeight}" fill="${options.colors.background}"/>
  <g transform="translate(${qrX}, ${qrY})">
    ${innerSvg}
  </g>
  <text x="${textX}" y="${textY}" font-family="${options.text.font}, sans-serif" font-size="${options.text.size}" ${fontWeightAttr} text-anchor="${textAnchor}" fill="${options.text.color}" ${rotateAttr}>${tileLabel}</text>
</svg>`

  return applySVGPadding(svgWithText, {
    top: Math.floor(options.qr.padding.top),
    right: Math.floor(options.qr.padding.right),
    bottom: Math.floor(options.qr.padding.bottom),
    left: Math.floor(options.qr.padding.left)
  }, options.colors.background)
}

export async function generateQR({ text, format, options, tileLabel }: GenerateQRParams): Promise<string> {
  return format === 'png'
    ? generatePNG(text, options, tileLabel)
    : generateSVG(text, options, tileLabel)
}
