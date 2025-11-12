import QRCodeStyling from 'qr-code-styling'
import type { QRDesignOptions, QRPadding } from './config'

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

async function generatePNG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  const qrCode = createQRConfig(text, options, 'canvas')
  const blob = await qrCode.getRawData('png')
  if (!blob) throw new Error('Failed to generate QR code')

  // For now, in the worker we'll just return the base QR code
  // without additional processing that requires DOM APIs
  // The canvas manipulation would need to be done on the main thread
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob as Blob)
  })
}

async function generateSVG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  const qrCode = createQRConfig(text, options, 'svg')
  const blob = await qrCode.getRawData('svg')
  if (!blob) throw new Error('Failed to generate QR SVG')

  let svgString = await (blob as Blob).text()

  // Add logo if not centered
  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    const logoSize = options.logo.size
    let logoX = 0
    let logoY = 0

    const edgeMargin = 15

    if (options.logo.placement === 'top-left') {
      logoX = edgeMargin
      logoY = edgeMargin
    } else if (options.logo.placement === 'top-right') {
      logoX = Math.max(edgeMargin, options.qr.size - logoSize - edgeMargin)
      logoY = edgeMargin
    } else if (options.logo.placement === 'bottom-left') {
      logoX = edgeMargin
      logoY = Math.max(edgeMargin, options.qr.size - logoSize - edgeMargin)
    } else if (options.logo.placement === 'bottom-right') {
      logoX = Math.max(edgeMargin, options.qr.size - logoSize - edgeMargin)
      logoY = Math.max(edgeMargin, options.qr.size - logoSize - edgeMargin)
    }

    svgString = svgString.replace(
      '</svg>',
      `<image href="${options.logo.dataURL}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/></svg>`
    )
  }

  // Add text label if enabled
  if (tileLabel && options.text.enabled) {
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

    svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${finalWidth} ${finalHeight}" width="${finalWidth}" height="${finalHeight}">
  <rect width="${finalWidth}" height="${finalHeight}" fill="${options.colors.background}"/>
  <g transform="translate(${qrX}, ${qrY})">
    ${innerSvg}
  </g>
  <text x="${textX}" y="${textY}" font-family="${options.text.font}, sans-serif" font-size="${options.text.size}" ${fontWeightAttr} text-anchor="${textAnchor}" fill="${options.text.color}" ${rotateAttr}>${tileLabel}</text>
</svg>`
  }

  // Add padding
  if (options.qr.padding) {
    const padding = options.qr.padding
    if (padding.top !== 0 || padding.right !== 0 || padding.bottom !== 0 || padding.left !== 0) {
      const widthMatch = svgString.match(/width="([^"]+)"/)
      const heightMatch = svgString.match(/height="([^"]+)"/)

      if (widthMatch && heightMatch) {
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

        svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${newWidth} ${newHeight}" width="${newWidth}" height="${newHeight}">
  <rect width="${newWidth}" height="${newHeight}" fill="${options.colors.background}"/>
  <g transform="translate(${padding.left}, ${padding.top})">
    ${innerSvg}
  </g>
</svg>`
      }
    }
  }

  return svgString
}

export async function generateQR({ text, format, options, tileLabel }: GenerateQRParams): Promise<string> {
  return format === 'png'
    ? generatePNG(text, options, tileLabel)
    : generateSVG(text, options, tileLabel)
}