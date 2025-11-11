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
    await downloadAllQRs(batch)
    exporting = false
  }

  function handleExportCSV() {
    if (!batch) return
    downloadCSV(batch)
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
        <TileCard {tile} batchId={batch.batchId} />
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

  label {
    font-weight: 600;
  }

  select {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    min-width: 200px;
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
