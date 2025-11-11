import QRCodeStyling from 'qr-code-styling'
import type { QRDesignOptions } from './config'
import { calculateLogoPosition } from './logo-utils'

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
    margin: Math.floor(qr.margin),
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
  placement: 'top-left' | 'top-right' | 'bottom-left',
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

function addTextLabel(
  canvas: HTMLCanvasElement,
  label: string,
  qrSize: number,
  textConfig: QRDesignOptions['text']
): HTMLCanvasElement {
  const marginPercent = textConfig.margin / 100
  const labelMargin = textConfig.margin === 0 ? 0 : Math.floor(qrSize * marginPercent)
  const lineHeight = textConfig.size * 1.5
  const textHeight = lineHeight + labelMargin
  const finalWidth = qrSize + labelMargin * 2
  const finalHeight = qrSize + labelMargin * 2 + textHeight

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = finalWidth
  finalCanvas.height = finalHeight

  const ctx = finalCanvas.getContext('2d')!
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, finalWidth, finalHeight)

  const qrY = textConfig.position === 'top' ? textHeight : labelMargin
  ctx.drawImage(canvas, labelMargin, qrY)

  ctx.fillStyle = textConfig.color
  ctx.font = `${textConfig.weight} ${textConfig.size}px ${textConfig.font}, sans-serif`
  ctx.textAlign = textConfig.align

  let textX = finalWidth / 2
  if (textConfig.align === 'left') textX = labelMargin
  if (textConfig.align === 'right') textX = finalWidth - labelMargin

  const textY = textConfig.position === 'top'
    ? lineHeight * 0.8
    : qrSize + labelMargin + labelMargin + lineHeight * 0.8

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
    reader.readAsDataURL(blob)
  })

  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    await addNonCenterLogo(
      canvas,
      options.logo.dataURL,
      options.logo.size,
      options.logo.placement as 'top-left' | 'top-right' | 'bottom-left',
      options.qr.size
    )
  }

  const finalCanvas = tileLabel && options.text.enabled
    ? addTextLabel(canvas, tileLabel, options.qr.size, options.text)
    : canvas

  return finalCanvas.toDataURL()
}

async function generateSVG(text: string, options: QRDesignOptions, tileLabel?: string): Promise<string> {
  const qrCode = createQRConfig(text, options, 'svg')
  const blob = await qrCode.getRawData('svg')
  if (!blob) throw new Error('Failed to generate QR SVG')

  let svgString = await blob.text()

  if (options.logo.enabled && options.logo.dataURL && options.logo.placement !== 'center') {
    const { x, y } = calculateLogoPosition(
      options.logo.placement,
      options.qr.size,
      options.logo.size
    )
    svgString = svgString.replace(
      '</svg>',
      `<image href="${options.logo.dataURL}" x="${x}" y="${y}" width="${options.logo.size}" height="${options.logo.size}"/></svg>`
    )
  }

  if (!tileLabel || !options.text.enabled) {
    return svgString
  }

  const marginPercent = options.text.margin / 100
  const labelMargin = options.text.margin === 0 ? 0 : Math.floor(options.qr.size * marginPercent)
  const lineHeight = options.text.size * 1.5
  const textHeight = lineHeight + labelMargin
  const finalWidth = options.qr.size + labelMargin * 2
  const finalHeight = options.qr.size + labelMargin * 2 + textHeight

  const innerSvg = svgString.replace(/<svg[^>]*>/, '').replace('</svg>', '')
  const qrY = options.text.position === 'top' ? textHeight : labelMargin
  const textY = options.text.position === 'top'
    ? lineHeight * 0.8
    : options.qr.size + labelMargin + labelMargin + lineHeight * 0.8

  let textX = finalWidth / 2
  let textAnchor = 'middle'
  if (options.text.align === 'left') {
    textX = labelMargin
    textAnchor = 'start'
  }
  if (options.text.align === 'right') {
    textX = finalWidth - labelMargin
    textAnchor = 'end'
  }

  const fontWeightAttr = options.text.weight === 'bold' ? 'font-weight="bold"' : ''
  const rotateAttr = options.text.rotation !== 0
    ? `transform="rotate(${options.text.rotation} ${textX} ${textY})"`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${finalWidth} ${finalHeight}" width="${finalWidth}" height="${finalHeight}">
  <rect width="${finalWidth}" height="${finalHeight}" fill="white"/>
  <g transform="translate(${labelMargin}, ${qrY})">
    ${innerSvg}
  </g>
  <text x="${textX}" y="${textY}" font-family="${options.text.font}, sans-serif" font-size="${options.text.size}" ${fontWeightAttr} text-anchor="${textAnchor}" fill="${options.text.color}" ${rotateAttr}>${tileLabel}</text>
</svg>`
}

export async function generateQR({ text, format, options, tileLabel }: GenerateQRParams): Promise<string> {
  return format === 'png'
    ? generatePNG(text, options, tileLabel)
    : generateSVG(text, options, tileLabel)
}
