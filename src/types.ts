export interface TileMapping {
  tile_number: number
  secure_id: string
  status: string
}

export interface TileBatch {
  title: string
  batchId: string
  shopifyProductId: string
  totalTiles: number
  idLength: number
  includeBatchPrefix: boolean
  uuid: string
  tiles: TileMapping[]
}
