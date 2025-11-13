export interface Theme {
  name: string
  label: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
}

export const themes: Theme[] = [
  {
    name: 'nordic-light',
    label: 'Nordic Light',
    colors: {
      background: '210 20% 98%',
      foreground: '222 47% 11%',
      card: '210 17% 94%',
      cardForeground: '222 47% 11%',
      popover: '210 17% 94%',
      popoverForeground: '222 47% 11%',
      primary: '210 34% 46%',
      primaryForeground: '210 20% 98%',
      secondary: '210 12% 88%',
      secondaryForeground: '222 47% 11%',
      muted: '210 12% 90%',
      mutedForeground: '215 16% 47%',
      accent: '200 18% 46%',
      accentForeground: '210 20% 98%',
      destructive: '0 60% 51%',
      destructiveForeground: '210 20% 98%',
      border: '214 12% 90%',
      input: '214 12% 88%',
      ring: '210 34% 46%'
    }
  },
  {
    name: 'professional-dark',
    label: 'Professional Dark',
    colors: {
      background: '222 47% 11%',
      foreground: '210 40% 98%',
      card: '222 47% 16%',
      cardForeground: '210 40% 98%',
      popover: '222 47% 16%',
      popoverForeground: '210 40% 98%',
      primary: '180 62% 55%',
      primaryForeground: '222 47% 11%',
      secondary: '217 33% 25%',
      secondaryForeground: '210 40% 98%',
      muted: '217 33% 20%',
      mutedForeground: '215 20% 65%',
      accent: '173 58% 39%',
      accentForeground: '210 40% 98%',
      destructive: '0 63% 61%',
      destructiveForeground: '210 40% 98%',
      border: '217 33% 18%',
      input: '217 33% 22%',
      ring: '180 62% 55%'
    }
  },
  {
    name: 'warm-neutral',
    label: 'Warm Neutral',
    colors: {
      background: '40 40% 97%',
      foreground: '25 25% 15%',
      card: '35 25% 92%',
      cardForeground: '25 25% 15%',
      popover: '35 25% 92%',
      popoverForeground: '25 25% 15%',
      primary: '25 45% 40%',
      primaryForeground: '40 40% 97%',
      secondary: '35 35% 78%',
      secondaryForeground: '25 25% 15%',
      muted: '35 20% 88%',
      mutedForeground: '25 15% 45%',
      accent: '18 60% 50%',
      accentForeground: '40 40% 97%',
      destructive: '0 70% 50%',
      destructiveForeground: '40 40% 97%',
      border: '35 15% 88%',
      input: '35 15% 86%',
      ring: '25 45% 40%'
    }
  },
  {
    name: 'high-contrast',
    label: 'High Contrast',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 0%',
      card: '240 5% 97%',
      cardForeground: '0 0% 0%',
      popover: '240 5% 97%',
      popoverForeground: '0 0% 0%',
      primary: '263 70% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '240 5% 87%',
      secondaryForeground: '0 0% 0%',
      muted: '240 5% 92%',
      mutedForeground: '240 4% 30%',
      accent: '280 65% 60%',
      accentForeground: '0 0% 0%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '240 6% 88%',
      input: '240 6% 86%',
      ring: '263 70% 50%'
    }
  },
  {
    name: 'monochrome-pro',
    label: 'Monochrome Pro',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      card: '0 0% 96%',
      cardForeground: '0 0% 9%',
      popover: '0 0% 96%',
      popoverForeground: '0 0% 9%',
      primary: '0 0% 20%',
      primaryForeground: '0 0% 98%',
      secondary: '0 0% 78%',
      secondaryForeground: '0 0% 9%',
      muted: '0 0% 91%',
      mutedForeground: '0 0% 40%',
      accent: '0 0% 35%',
      accentForeground: '0 0% 98%',
      destructive: '0 0% 25%',
      destructiveForeground: '0 0% 98%',
      border: '0 0% 91%',
      input: '0 0% 89%',
      ring: '0 0% 20%'
    }
  }
]

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(`--${cssVar}`, value)
  })
  localStorage.setItem('app-theme', theme.name)
}

export function getStoredTheme(): string {
  return localStorage.getItem('app-theme') || 'nordic-light'
}

export function loadTheme(): void {
  const themeName = getStoredTheme()
  const theme = themes.find((t) => t.name === themeName) || themes[0]
  applyTheme(theme)
}
