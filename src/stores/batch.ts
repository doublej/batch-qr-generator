import { writable } from 'svelte/store'
import type { TileBatch } from '../types'

export const currentBatch = writable<TileBatch | null>(null)
export const selectedFile = writable<string>('')
export const baseURL = writable<string>('https://example.com/')
