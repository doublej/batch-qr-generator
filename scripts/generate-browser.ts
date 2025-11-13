#!/usr/bin/env tsx

import { createCanvas, Image, Canvas } from 'canvas'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { QRDesignOptions } from '../src/lib/config'
import { generateQR } from '../src/lib/qr-generation'

// Setup globals for browser code compatibility
global.HTMLCanvasElement = Canvas as any
global.Image = Image as any
global.document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return createCanvas(300, 300) as any
    }
    throw new Error(`createElement not implemented for ${tag}`)
  }
} as any

async function loadConfig(configPath: string): Promise<QRDesignOptions> {
  const content = readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: tsx scripts/generate-browser.ts <config.json> <text> [label] [output.png|output.svg]')
    console.error('Example: tsx scripts/generate-browser.ts config.json "https://example.com" "Example" output.png')
    console.error('Example: tsx scripts/generate-browser.ts config.json "https://example.com" "Example" output.svg')
    console.error('\nThis uses the EXACT same generateQR function as the browser UI.')
    process.exit(1)
  }

  const [configPath, text, label, outputPath] = args
  const output = outputPath || 'output.png'
  const format = output.endsWith('.svg') ? 'svg' : 'png'

  try {
    const config = await loadConfig(resolve(configPath))
    console.log('Loaded config:', JSON.stringify(config, null, 2))
    console.log('Generating', format.toUpperCase(), 'format using browser function...')

    const dataURL = await generateQR({
      text,
      format: format as 'png' | 'svg',
      options: config,
      tileLabel: label
    })

    if (format === 'svg') {
      // SVG returns as string directly
      writeFileSync(output, dataURL, 'utf-8')
    } else {
      // PNG returns as data URL
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      writeFileSync(output, buffer)
    }

    console.log(`QR code generated successfully: ${output}`)
  } catch (error) {
    console.error('Error:', error)
    console.error((error as Error).stack)
    process.exit(1)
  }
}

main()
