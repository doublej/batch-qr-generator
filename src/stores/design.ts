import { writable } from 'svelte/store'
import type { QRDesignOptions } from '../lib/config'
import { defaultQRDesign } from '../lib/config'

export const designOptions = writable<QRDesignOptions>(defaultQRDesign)
