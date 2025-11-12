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
