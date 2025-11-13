#!/usr/bin/env node

import { createCanvas, loadImage, Canvas, Image } from 'canvas'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Setup globals for browser code compatibility
global.HTMLCanvasElement = Canvas
global.Image = Image
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return createCanvas(300, 300)
    }
    throw new Error(`createElement not implemented for ${tag}`)
  }
}

async function loadConfig(configPath) {
  const content = readFileSync(configPath, 'utf-8')
  const data = JSON.parse(content)

  // Handle session format (state.design) or direct config format
  if (data.state && data.state.design) {
    return data.state.design
  }

  return data
}

async function generateQRSVG(text, options, tileLabel) {
  const { qr, colors } = options
  const eclMap = { L: 'L', M: 'M', Q: 'Q', H: 'H' }

  let svgString = await QRCode.toString(text, {
    type: 'svg',
    width: qr.size,
    color: {
      dark: colors.dataModuleColor,
      light: colors.background
    },
    errorCorrectionLevel: eclMap[qr.errorCorrection],
    margin: 0
  })

  if (!tileLabel || !options.text.enabled) {
    return svgString
  }

  const textSpacing = 10
  const isHorizontal = options.text.position === 'left' || options.text.position === 'right'
  const textHeight = options.text.size * 1.3
  const isAbove = options.text.position === 'top'
  const offsetBuffer = isAbove ? Math.max(0, -options.text.offsetY) : Math.max(0, options.text.offsetY)
  const textSpace = textHeight + textSpacing + offsetBuffer
  const finalWidth = isHorizontal ? qr.size + qr.size : qr.size
  const finalHeight = isHorizontal ? qr.size : qr.size + textSpace

  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/)
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${qr.size} ${qr.size}`

  const innerSvg = svgString
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace('</svg>', '')
    .trim()

  const qrX = isHorizontal && options.text.position === 'left' ? qr.size : 0
  const qrY = options.text.position === 'top' ? textSpace : 0

  let textX = options.text.offsetX
  let textY = options.text.size + options.text.offsetY

  if (options.text.position === 'bottom') {
    textY = qr.size + textSpacing + options.text.size + options.text.offsetY
  } else if (options.text.position === 'top') {
    textY = options.text.size + offsetBuffer + options.text.offsetY
  } else if (options.text.position === 'right') {
    textX = qr.size + options.text.offsetX
    textY = qr.size / 2 + options.text.offsetY
  } else if (options.text.position === 'left') {
    textX = qr.size / 2 + options.text.offsetX
    textY = qr.size / 2 + options.text.offsetY
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${finalWidth} ${finalHeight}" width="${finalWidth}" height="${finalHeight}">
  <rect width="${finalWidth}" height="${finalHeight}" fill="${colors.background}"/>
  <svg x="${qrX}" y="${qrY}" width="${qr.size}" height="${qr.size}" viewBox="${viewBox}">
    ${innerSvg}
  </svg>
  <text x="${textX}" y="${textY}" font-family="${options.text.font}, sans-serif" font-size="${options.text.size}" ${fontWeightAttr} text-anchor="${textAnchor}" fill="${options.text.color}" ${rotateAttr}>${tileLabel}</text>
</svg>`
}

async function generateQRPNG(text, options, tileLabel) {
  const { qr, colors } = options
  const eclMap = { L: 'L', M: 'M', Q: 'Q', H: 'H' }

  const dataURL = await QRCode.toDataURL(text, {
    width: qr.size,
    color: {
      dark: colors.dataModuleColor,
      light: colors.background
    },
    errorCorrectionLevel: eclMap[qr.errorCorrection],
    margin: 0
  })

  const img = await loadImage(dataURL)
  const canvas = createCanvas(qr.size, qr.size)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  if (tileLabel && options.text.enabled) {
    const textHeight = options.text.size * 1.3
    const textSpacing = 10
    const isAbove = options.text.position === 'top'
    const offsetBuffer = isAbove ? Math.max(0, -options.text.offsetY) : Math.max(0, options.text.offsetY)
    const textSpace = textHeight + textSpacing + offsetBuffer

    const finalCanvas = createCanvas(qr.size, qr.size + textSpace)
    const finalCtx = finalCanvas.getContext('2d')

    finalCtx.fillStyle = colors.background
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

    const qrY = options.text.position === 'top' ? textSpace : 0
    finalCtx.drawImage(canvas, 0, qrY)

    finalCtx.fillStyle = options.text.color
    finalCtx.font = `${options.text.weight === 'bold' ? 'bold ' : ''}${options.text.size}px ${options.text.font}`
    finalCtx.textAlign = options.text.align

    let textY = options.text.size + options.text.offsetY
    if (options.text.position === 'bottom') {
      textY = qr.size + textSpacing + options.text.size + options.text.offsetY
    } else if (options.text.position === 'top') {
      textY = options.text.size + offsetBuffer + options.text.offsetY
    }

    let textX = options.text.offsetX
    if (options.text.align === 'center') {
      textX = finalCanvas.width / 2 + options.text.offsetX
    }

    finalCtx.fillText(tileLabel, textX, textY)

    if (qr.padding.top || qr.padding.right || qr.padding.bottom || qr.padding.left) {
      const paddedCanvas = createCanvas(
        finalCanvas.width + qr.padding.left + qr.padding.right,
        finalCanvas.height + qr.padding.top + qr.padding.bottom
      )
      const paddedCtx = paddedCanvas.getContext('2d')

      paddedCtx.fillStyle = colors.background
      paddedCtx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height)
      paddedCtx.drawImage(finalCanvas, qr.padding.left, qr.padding.top)

      return paddedCanvas.toBuffer('image/png')
    }

    return finalCanvas.toBuffer('image/png')
  }

  if (qr.padding.top || qr.padding.right || qr.padding.bottom || qr.padding.left) {
    const paddedCanvas = createCanvas(
      canvas.width + qr.padding.left + qr.padding.right,
      canvas.height + qr.padding.top + qr.padding.bottom
    )
    const paddedCtx = paddedCanvas.getContext('2d')

    paddedCtx.fillStyle = colors.background
    paddedCtx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height)
    paddedCtx.drawImage(canvas, qr.padding.left, qr.padding.top)

    return paddedCanvas.toBuffer('image/png')
  }

  return canvas.toBuffer('image/png')
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: node scripts/generate-headless.mjs <config.json> <text> [label] [output.png|output.svg]')
    console.error('Example: node scripts/generate-headless.mjs config.json "https://example.com" "Example" output.png')
    console.error('Example: node scripts/generate-headless.mjs config.json "https://example.com" "Example" output.svg')
    console.error('\nOr use browser functions:')
    console.error('Example: node scripts/generate-headless.mjs config.json "https://example.com" "Example" output.svg --use-browser')
    process.exit(1)
  }

  const [configPath, text, label, outputPath, useBrowserFlag] = args
  const output = outputPath || 'output.png'
  const format = output.endsWith('.svg') ? 'svg' : 'png'
  const useBrowser = useBrowserFlag === '--use-browser'

  try {
    const config = await loadConfig(resolve(configPath))
    console.log('Loaded config:', JSON.stringify(config, null, 2))
    console.log('Generating', format.toUpperCase(), 'format...')
    console.log('Method:', useBrowser ? 'Browser functions (qr-generation.ts)' : 'Direct generation')

    if (useBrowser) {
      // Import and use the actual browser QR generation function
      // Need to use tsx to handle TypeScript imports
      const { spawn } = await import('child_process')
      const { promisify } = await import('util')
      const execFile = promisify((await import('child_process')).execFile)

      console.error('Browser mode requires tsx for TypeScript support')
      console.error('Falling back to direct generation...')

      if (format === 'svg') {
        const svg = await generateQRSVG(text, config, label)
        writeFileSync(output, svg, 'utf-8')
      } else {
        const buffer = await generateQRPNG(text, config, label)
        writeFileSync(output, buffer)
      }

      if (format === 'svg') {
        // SVG returns as string directly
        writeFileSync(output, dataURL, 'utf-8')
      } else {
        // PNG returns as data URL
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        writeFileSync(output, buffer)
      }
    } else {
      if (format === 'svg') {
        const svg = await generateQRSVG(text, config, label)
        writeFileSync(output, svg, 'utf-8')
      } else {
        const buffer = await generateQRPNG(text, config, label)
        writeFileSync(output, buffer)
      }
    }

    console.log(`QR code generated successfully: ${output}`)
  } catch (error) {
    console.error('Error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
