export interface LogoDimensions {
  width: number
  height: number
  x: number
  y: number
}

export function resolveLogoDimensions(
  logoConfig: { size: number; width?: number; height?: number; fit: string },
  imageNaturalWidth: number,
  imageNaturalHeight: number,
  containerSize: number
): { width: number; height: number } {
  const targetWidth = logoConfig.width ?? logoConfig.size
  const targetHeight = logoConfig.height ?? logoConfig.size
  const aspectRatio = imageNaturalWidth / imageNaturalHeight

  switch (logoConfig.fit) {
    case 'fill':
      return { width: targetWidth, height: targetHeight }

    case 'contain': {
      const scale = Math.min(targetWidth / imageNaturalWidth, targetHeight / imageNaturalHeight)
      return { width: imageNaturalWidth * scale, height: imageNaturalHeight * scale }
    }

    case 'cover': {
      const scale = Math.max(targetWidth / imageNaturalWidth, targetHeight / imageNaturalHeight)
      return { width: imageNaturalWidth * scale, height: imageNaturalHeight * scale }
    }

    case 'scale-down': {
      if (imageNaturalWidth <= targetWidth && imageNaturalHeight <= targetHeight) {
        return { width: imageNaturalWidth, height: imageNaturalHeight }
      }
      const scale = Math.min(targetWidth / imageNaturalWidth, targetHeight / imageNaturalHeight)
      return { width: imageNaturalWidth * scale, height: imageNaturalHeight * scale }
    }

    default:
      return { width: targetWidth, height: targetHeight }
  }
}

export function calculateLogoPosition(
  placement: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  qrSize: number,
  logoSize: number
): { x: number; y: number } {
  const offset = 10

  switch (placement) {
    case 'center':
      return { x: (qrSize - logoSize) / 2, y: (qrSize - logoSize) / 2 }
    case 'top-left':
      return { x: offset, y: offset }
    case 'top-right':
      return { x: qrSize - logoSize - offset, y: offset }
    case 'bottom-left':
      return { x: offset, y: qrSize - logoSize - offset }
    case 'bottom-right':
      return { x: qrSize - logoSize - offset, y: qrSize - logoSize - offset }
  }
}

export function calculateLogoDimensions(
  placement: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  qrSize: number,
  logoWidth: number,
  logoHeight: number
): LogoDimensions {
  const offset = 10

  switch (placement) {
    case 'center':
      return {
        width: logoWidth,
        height: logoHeight,
        x: (qrSize - logoWidth) / 2,
        y: (qrSize - logoHeight) / 2
      }
    case 'top-left':
      return { width: logoWidth, height: logoHeight, x: offset, y: offset }
    case 'top-right':
      return { width: logoWidth, height: logoHeight, x: qrSize - logoWidth - offset, y: offset }
    case 'bottom-left':
      return { width: logoWidth, height: logoHeight, x: offset, y: qrSize - logoHeight - offset }
    case 'bottom-right':
      return {
        width: logoWidth,
        height: logoHeight,
        x: qrSize - logoWidth - offset,
        y: qrSize - logoHeight - offset
      }
  }
}
