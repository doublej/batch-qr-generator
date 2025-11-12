<script lang="ts">
  import type { QRConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { _ } from '../../lib/i18n'

  let { config = $bindable() }: { config: QRConfig } = $props()
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for="module-shape">{$_('shapeSettings.moduleShape')}</Label>
    <select
      id="module-shape"
      bind:value={config.moduleShape}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="square">{$_('shapeSettings.square')}</option>
      <option value="dots">{$_('shapeSettings.dots')}</option>
    </select>
  </div>
</div>
