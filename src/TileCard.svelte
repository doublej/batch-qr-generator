<script lang="ts">
  import { onMount } from 'svelte'
  import type { TileMapping } from './types'
  import { generateQRDataURL, getTileLabel, getTileURL, downloadQR } from './utils'

  interface Props {
    tile: TileMapping
    batchId: string
  }

  let { tile, batchId }: Props = $props()
  let qrCode = $state('')
  let loading = $state(true)
  let downloading = $state(false)

  async function loadQR() {
    const url = getTileURL(tile.secure_id)
    qrCode = await generateQRDataURL(url)
    loading = false
  }

  async function handleDownload() {
    downloading = true
    await downloadQR(tile, batchId)
    downloading = false
  }

  onMount(loadQR)
</script>

<div class="tile-card">
  <div class="tile-label">
    {getTileLabel(batchId, tile.tile_number)}
  </div>

  <div class="qr-container">
    {#if loading}
      <div class="loading">Generating QR...</div>
    {:else}
      <img src={qrCode} alt="QR Code for {tile.secure_id}" />
    {/if}
  </div>

  <div class="tile-id">{tile.secure_id}</div>

  <button onclick={handleDownload} disabled={loading || downloading}>
    {downloading ? 'Downloading...' : 'Download'}
  </button>
</div>

<style>
  .tile-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    background: white;
  }

  .tile-label {
    font-weight: 600;
    font-size: 0.9rem;
    text-align: center;
  }

  .qr-container {
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-container img {
    width: 100%;
    height: auto;
  }

  .loading {
    color: #666;
    font-size: 0.9rem;
  }

  .tile-id {
    font-family: monospace;
    font-size: 0.8rem;
    color: #666;
    word-break: break-all;
    text-align: center;
  }

  button {
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
</style>
