import type { TileBatch, TileMapping } from './types'

function extractValue(line: string): string {
  return line.split(':').slice(1).join(':').trim()
}

function parseTiles(content: string): TileMapping[] {
  const tiles: TileMapping[] = []
  const lines = content.split('\n')
  let current: Partial<TileMapping> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === '-') continue

    if (trimmed.startsWith('tile_number:')) {
      if (current.tile_number !== undefined) {
        tiles.push(current as TileMapping)
      }
      current = { tile_number: parseInt(extractValue(trimmed)) }
    } else if (trimmed.startsWith('secure_id:')) {
      current.secure_id = extractValue(trimmed)
    } else if (trimmed.startsWith('status:')) {
      current.status = extractValue(trimmed)
    }
  }

  if (current.tile_number !== undefined) {
    tiles.push(current as TileMapping)
  }

  return tiles
}

export function parseTileBatch(content: string): TileBatch {
  const sections = content.split('----').map(s => s.trim())
  const allLines = content.split('\n').map(l => l.trim())

  const title = extractValue(allLines.find(l => l.startsWith('Title:')) || '')
  const batchId = extractValue(allLines.find(l => l.startsWith('Batch-id:')) || '')
  const shopifyProductId = extractValue(allLines.find(l => l.startsWith('Shopify-product-id:')) || '')
  const totalTiles = parseInt(extractValue(allLines.find(l => l.startsWith('Total-tiles:')) || '0'))
  const idLength = parseInt(extractValue(allLines.find(l => l.startsWith('Id-length:')) || '0'))
  const includeBatchPrefix = extractValue(allLines.find(l => l.startsWith('Include-batch-prefix:')) || 'false') === 'true'

  const tilesSection = sections.find(s => s.includes('Tile-mappings:'))
  const tiles = tilesSection ? parseTiles(tilesSection) : []

  const uuidSection = sections.find(s => s.startsWith('Uuid:'))
  const uuid = uuidSection ? extractValue(uuidSection) : ''

  return {
    title,
    batchId,
    shopifyProductId,
    totalTiles,
    idLength,
    includeBatchPrefix,
    uuid,
    tiles
  }
}
