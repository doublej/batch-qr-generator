export interface QRPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface QRConfig {
  size: number
  padding: QRPadding
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
  dpi: number
}

export interface LogoConfig {
  enabled: boolean
  dataURL: string
  size: number
  width?: number
  height?: number
  fit: 'contain' | 'cover' | 'fill' | 'scale-down'
  placement: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface TextConfig {
  enabled: boolean
  size: number
  position: 'top' | 'bottom' | 'left' | 'right'
  offsetX: number
  offsetY: number
  align: 'left' | 'center' | 'right'
  font: string
  weight: 'normal' | 'bold'
  color: string
  rotation: number
}

export interface ColorConfig {
  background: string
  foreground: string
  border: string
  borderWidth: number
  eyeColor: string
  dataModuleColor: string
}

export interface GradientConfig {
  enabled: boolean
  type: 'linear' | 'radial'
  start: string
  end: string
  angle: number
}

export interface QRDesignOptions {
  qr: QRConfig
  logo: LogoConfig
  text: TextConfig
  colors: ColorConfig
  gradient: GradientConfig
}

export const defaultQRDesign: QRDesignOptions = {
  qr: {
    size: 300,
    padding: {
      top: 16,
      right: 16,
      bottom: 16,
      left: 16
    },
    errorCorrection: 'M',
    dpi: 300
  },
  logo: {
    enabled: true,
    dataURL: '',
    size: 60,
    fit: 'contain',
    placement: 'center'
  },
  text: {
    enabled: true,
    size: 16,
    position: 'bottom',
    offsetX: 0,
    offsetY: 0,
    align: 'center',
    font: 'system-ui',
    weight: 'normal',
    color: '#000000',
    rotation: 0
  },
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    border: '#000000',
    borderWidth: 0,
    eyeColor: '#000000',
    dataModuleColor: '#000000'
  },
  gradient: {
    enabled: false,
    type: 'linear',
    start: '#000000',
    end: '#666666',
    angle: 0
  }
}
