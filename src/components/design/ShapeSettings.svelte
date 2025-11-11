<script lang="ts">
  import type { QRConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'

  let { config = $bindable() }: { config: QRConfig } = $props()
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for="module-shape">Module Shape</Label>
    <select
      id="module-shape"
      bind:value={config.moduleShape}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="square">Square</option>
      <option value="dots">Dots</option>
    </select>
  </div>
</div>
