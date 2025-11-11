<script lang="ts">
  let count = $state(0)

  function increment() {
    count++
  }
</script>

<main>
  <h1>Haist QR Web</h1>
  <button onclick={increment}>
    Count: {count}
  </button>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 600;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
  }

  button:hover {
    background: #f5f5f5;
  }
</style>
