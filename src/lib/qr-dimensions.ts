// QR Code dimension utilities
// QR codes have versions 1-40, each with a specific number of modules
// Version n has (21 + 4 * (n - 1)) modules per side

/**
 * Calculate the number of modules for a given QR version
 */
export function getModulesForVersion(version: number): number {
  return 21 + 4 * (version - 1)
}

/**
 * Get common QR code module counts for versions 1-10 (most common)
 */
export function getCommonModuleCounts(): number[] {
  const versions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return versions.map(v => getModulesForVersion(v))
}

/**
 * Calculate valid pixel sizes for clean module boundaries
 * Returns an array of valid sizes within the given range
 */
export function calculateValidQRSizes(minSize: number, maxSize: number): number[] {
  const moduleCounts = getCommonModuleCounts() // [21, 25, 29, 33, 37, 41, 45, 49, 53, 57]
  const validSizes = new Set<number>()

  // For each module count, find pixel sizes that give clean pixels per module
  for (const modules of moduleCounts) {
    // Calculate pixels per module for min and max sizes
    const minPixelsPerModule = Math.floor(minSize / modules)
    const maxPixelsPerModule = Math.ceil(maxSize / modules)

    // Add all valid sizes for this module count
    for (let pixelsPerModule = minPixelsPerModule; pixelsPerModule <= maxPixelsPerModule; pixelsPerModule++) {
      const size = modules * pixelsPerModule
      if (size >= minSize && size <= maxSize) {
        validSizes.add(size)
      }
    }
  }

  return Array.from(validSizes).sort((a, b) => a - b)
}

/**
 * Find the nearest valid QR size to a given size
 */
export function snapToValidQRSize(targetSize: number, minSize: number, maxSize: number): number {
  const validSizes = calculateValidQRSizes(minSize, maxSize)

  if (validSizes.length === 0) {
    return targetSize
  }

  // Find the closest valid size
  let closest = validSizes[0]
  let minDiff = Math.abs(targetSize - closest)

  for (const size of validSizes) {
    const diff = Math.abs(targetSize - size)
    if (diff < minDiff) {
      minDiff = diff
      closest = size
    }
  }

  return closest
}

/**
 * Get the likely module count for a given pixel size
 * Returns the module count that gives the cleanest fit
 */
export function getEstimatedModuleCount(pixelSize: number): number {
  const moduleCounts = getCommonModuleCounts()
  let bestModules = 21
  let bestFit = Number.MAX_VALUE

  for (const modules of moduleCounts) {
    const pixelsPerModule = pixelSize / modules
    const remainder = pixelsPerModule % 1

    // Prefer module counts that give whole pixels per module
    // or very close to whole pixels
    const fit = Math.min(remainder, 1 - remainder)

    if (fit < bestFit) {
      bestFit = fit
      bestModules = modules
    }
  }

  return bestModules
}

/**
 * Calculate the pixels per module for a given size and module count
 */
export function getPixelsPerModule(pixelSize: number, moduleCount: number): number {
  return Math.floor(pixelSize / moduleCount)
}