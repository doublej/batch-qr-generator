import QRCode from 'qrcode'
import type { QRDesignOptions, QRPadding } from './config'
import { calculateLogoPosition, calculateLogoDimensions, resolveLogoDimensions } from './logo-utils'
import { getEstimatedModuleCount, getPixelsPerModule } from './qr-dimensions'

interface GenerateQRParams {
  text: string
  format: 'png' | 'svg'
  options: QRDesignOptions
  tileLabel?: string
}

async function createBasicQRSVG(text: string, options: QRDesignOptions): Promise<string> {
  const { qr, colors } = options
  const eclMap = { L: 'L', M: 'M', Q: 'Q', H: 'H' } as const

  return await QRCode.toString(text, {
    type: 'svg',
    width: qr.size,
    color: {
      dark: colors.dataModuleColor,
      light: colors.background
    },
    errorCorrectionLevel: eclMap[qr.errorCorrection],
    margin: 0
  })
}

async function addNonCenterLogo(
  canvas: HTMLCanvasElement,
  logoDataURL: string,
  logoConfig: { size: number; width?: number; height?: number; fit: string },
  placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  qrSize: number
): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const logoImg = new Image()

  return new Promise((resolve, reject) => {
    logoImg.onload = () => {
      const targetWidth = logoConfig.width ?? logoConfig.size
      const targetHeight = logoConfig.height ?? logoConfig.size
      const { width, height } = resolveLogoDimensions(
        logoConfig,
        logoImg.naturalWidth,
        logoImg.naturalHeight,
        qrSize
      )

      if (logoConfig.fit === 'cover') {
        const { x, y } = calculateLogoDimensions(placement, qrSize, targetWidth, targetHeight)
        ctx.save()
        ctx.rect(x, y, targetWidth, targetHeight)
        ctx.clip()
        const offsetX = x - (width - targetWidth) / 2
        const offsetY = y - (height - targetHeight) / 2
        ctx.drawImage(logoImg, offsetX, offsetY, width, height)
        ctx.restore()
      } else {
        const { x, y } = calculateLogoDimensions(placement, qrSize, width, height)
        ctx.drawImage(logoImg, x, y, width, height)
      }
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

  // Use the full canvas dimensions when text is included
  const contentWidth = canvas.width
  const contentHeight = canvas.height

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = contentWidth + padding.left + padding.right
  finalCanvas.height = contentHeight + padding.top + padding.bottom

  const ctx = finalCanvas.getContext('2d')!
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

  ctx.drawImage(
    canvas,
    0, 0, contentWidth, contentHeight,
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

  // Calculate space: textSize (ascent) + textSize*0.3 (descent) + spacing + offsetY buffer
  const textHeight = textConfig.size * 1.3 // Account for ascenders and descenders
  const isAbove = textConfig.position === 'top'
  const offsetBuffer = isAbove ? Math.max(0, -textConfig.offsetY) : Math.max(0, textConfig.offsetY)
  const textSpace = textHeight + textSpacing + offsetBuffer
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
  let textY = textConfig.size + textConfig.offsetY // Default for top position

  if (textConfig.position === 'bottom') {
    textY = qrSize + textSpacing + textConfig.size + textConfig.offsetY
  } else if (textConfig.position === 'top') {
    textY = textConfig.size + offsetBuffer + textConfig.offsetY
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

async function svgToCanvas(svgString: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const img = new Image()

  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString)
  })
}

async function generatePNG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  const svgString = await createBasicQRSVG(text, options)
  const canvas = await svgToCanvas(svgString)

  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    await addNonCenterLogo(
      canvas,
      options.logo.dataURL,
      { size: options.logo.size, width: options.logo.width, height: options.logo.height, fit: options.logo.fit },
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
  // Use a more precise approach to extract just the content between the outer <svg> tags
  const innerSvg = svgString
    .replace(/<\?xml[^?]*\?>/g, '') // Remove any XML declarations
    .replace(/^<svg[^>]*>/, '')      // Remove opening SVG tag (start of string)
    .replace(/<\/svg>\s*$/, '')      // Remove closing SVG tag (end of string)
    .trim()                           // Clean up whitespace

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${newWidth} ${newHeight}" width="${newWidth}" height="${newHeight}">
  <rect width="${newWidth}" height="${newHeight}" fill="${backgroundColor}"/>
  <g transform="translate(${padding.left}, ${padding.top})">
    ${innerSvg}
  </g>
</svg>`
}

async function generateSVG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  let svgString = await createBasicQRSVG(text, options)

  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    const logoImg = new Image()
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve
      logoImg.onerror = reject
      logoImg.src = options.logo.dataURL
    })

    const targetWidth = options.logo.width ?? options.logo.size
    const targetHeight = options.logo.height ?? options.logo.size
    const { width, height } = resolveLogoDimensions(
      { size: options.logo.size, width: options.logo.width, height: options.logo.height, fit: options.logo.fit },
      logoImg.naturalWidth,
      logoImg.naturalHeight,
      options.qr.size
    )

    if (options.logo.fit === 'cover') {
      const { x, y } = calculateLogoDimensions(
        options.logo.placement as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
        options.qr.size,
        targetWidth,
        targetHeight
      )
      const offsetX = x - (width - targetWidth) / 2
      const offsetY = y - (height - targetHeight) / 2
      const clipId = `logo-clip-${Math.random().toString(36).substr(2, 9)}`
      svgString = svgString.replace(
        '</svg>',
        `<defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${targetWidth}" height="${targetHeight}"/></clipPath></defs><image href="${options.logo.dataURL}" x="${offsetX}" y="${offsetY}" width="${width}" height="${height}" clip-path="url(#${clipId})"/></svg>`
      )
    } else {
      const { x, y } = calculateLogoDimensions(
        options.logo.placement as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
        options.qr.size,
        width,
        height
      )
      const preserveAspectRatio = options.logo.fit === 'fill' ? 'none' : 'xMidYMid meet'
      svgString = svgString.replace(
        '</svg>',
        `<image href="${options.logo.dataURL}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${preserveAspectRatio}"/></svg>`
      )
    }
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

  // Calculate space: textSize (ascent) + textSize*0.3 (descent) + spacing + offsetY buffer
  const textHeight = options.text.size * 1.3
  const isAbove = options.text.position === 'top'
  const offsetBuffer = isAbove ? Math.max(0, -options.text.offsetY) : Math.max(0, options.text.offsetY)
  const textSpace = textHeight + textSpacing + offsetBuffer
  const finalWidth = isHorizontal ? options.qr.size + options.qr.size : options.qr.size
  const finalHeight = isHorizontal ? options.qr.size : options.qr.size + textSpace

  // Extract inner SVG content and viewBox while removing any XML declarations
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${options.qr.size} ${options.qr.size}`

  const innerSvg = svgString
    .replace(/<\?xml[^?]*\?>/g, '') // Remove any XML declarations
    .replace(/<svg[^>]*>/, '')       // Remove opening SVG tag
    .replace('</svg>', '')            // Remove closing SVG tag
    .trim()                           // Clean up whitespace
  const qrX = isHorizontal && options.text.position === 'left' ? options.qr.size : 0
  const qrY = options.text.position === 'top' ? textSpace : 0

  let textX = options.text.offsetX
  let textY = options.text.size + options.text.offsetY // Default for top position

  if (options.text.position === 'bottom') {
    textY = options.qr.size + textSpacing + options.text.size + options.text.offsetY
  } else if (options.text.position === 'top') {
    textY = options.text.size + offsetBuffer + options.text.offsetY
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
  <svg x="${qrX}" y="${qrY}" width="${options.qr.size}" height="${options.qr.size}" viewBox="${viewBox}">
    ${innerSvg}
  </svg>
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
