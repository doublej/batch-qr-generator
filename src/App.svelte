<script lang="ts">
  import TileCard from './TileCard.svelte'
  import type { TileBatch } from './types'
  import { parseTileBatch } from './parser'
  import { downloadAllQRs, downloadCSV } from './utils'

  const BATCH_FILES = [
    'tile-batch1.txt',
    'tile-batch2.txt',
    'tile-batch3.txt'
  ]

  let selectedFile = $state('')
  let batch = $state<TileBatch | null>(null)
  let loading = $state(false)
  let exporting = $state(false)
  let baseURL = $state('https://haist.ai/t/')
  let prefixText = $state('')
  let suffixText = $state('')

  async function loadBatch(filename: string) {
    loading = true
    const response = await fetch(`/kirby-data/${filename}`)
    const content = await response.text()
    batch = parseTileBatch(content)
    loading = false
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedFile = target.value
    if (selectedFile) {
      loadBatch(selectedFile)
    } else {
      batch = null
    }
  }

  async function handleExportZIP() {
    if (!batch) return
    exporting = true
    await downloadAllQRs(batch, baseURL, prefixText, suffixText)
    exporting = false
  }

  function handleExportCSV() {
    if (!batch) return
    downloadCSV(batch, baseURL)
  }
</script>

<main>
  <header>
    <h1>Haist QR Code Generator</h1>
    <p>Generate and download QR codes for tile batches</p>
  </header>

  <div class="controls">
    <div class="file-selector">
      <label for="batch-file">Select Batch File:</label>
      <select id="batch-file" value={selectedFile} onchange={handleFileSelect}>
        <option value="">-- Choose a batch --</option>
        {#each BATCH_FILES as file}
          <option value={file}>{file}</option>
        {/each}
      </select>
    </div>

    <div class="url-config">
      <label for="base-url">Base URL:</label>
      <input
        id="base-url"
        type="text"
        bind:value={baseURL}
        placeholder="https://haist.ai/t/"
      />
      <span class="url-preview">QR codes will link to: {baseURL}[secure-id]</span>
    </div>

    <div class="text-config">
      <div class="text-input-group">
        <label for="prefix-text">Text before tile ID:</label>
        <input
          id="prefix-text"
          type="text"
          bind:value={prefixText}
          placeholder="e.g., Scan for"
        />
      </div>
      <div class="text-input-group">
        <label for="suffix-text">Text after tile ID:</label>
        <input
          id="suffix-text"
          type="text"
          bind:value={suffixText}
          placeholder="e.g., Register now!"
        />
      </div>
    </div>

    {#if batch}
      <div class="batch-info">
        <h2>{batch.title}</h2>
        <p>Batch ID: <strong>{batch.batchId}</strong></p>
        <p>Total Tiles: <strong>{batch.totalTiles}</strong></p>
      </div>

      <div class="export-buttons">
        <button onclick={handleExportZIP} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Download All QR Codes (ZIP)'}
        </button>
        <button onclick={handleExportCSV}>
          Export CSV
        </button>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading-message">Loading batch file...</div>
  {:else if batch}
    <div class="tiles-grid">
      {#each batch.tiles as tile}
        <TileCard {tile} batchId={batch.batchId} {baseURL} {prefixText} {suffixText} />
      {/each}
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  header p {
    color: #666;
    font-size: 1.1rem;
  }

  .controls {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .file-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .url-config,
  .text-config {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .text-config {
    gap: 1rem;
  }

  .text-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .url-preview {
    font-size: 0.9rem;
    color: #666;
    font-family: monospace;
  }

  label {
    font-weight: 600;
  }

  select,
  input[type="text"] {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  select {
    min-width: 200px;
  }

  input[type="text"] {
    width: 100%;
    max-width: 500px;
  }

  .batch-info h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .batch-info p {
    margin: 0.25rem 0;
    color: #555;
  }

  .export-buttons {
    display: flex;
    gap: 1rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #218838;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading-message {
    text-align: center;
    padding: 3rem;
    font-size: 1.2rem;
    color: #666;
  }

  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    .tiles-grid {
      grid-template-columns: 1fr;
    }

    .export-buttons {
      flex-direction: column;
    }
  }
</style>
