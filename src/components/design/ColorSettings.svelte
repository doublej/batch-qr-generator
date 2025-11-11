<script lang="ts">
  import type { ColorConfig, GradientConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Slider } from '$lib/components/ui/slider'
  import { Separator } from '$lib/components/ui/separator'

  let {
    colors = $bindable(),
    gradient = $bindable()
  }: {
    colors: ColorConfig
    gradient: GradientConfig
  } = $props()

  let angleArray = $state([gradient.angle])

  $effect(() => {
    gradient.angle = angleArray[0]
  })
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="eye-color">Eye Pattern Color</Label>
      <Input id="eye-color" type="color" bind:value={colors.eyeColor} class="h-10" />
    </div>
    <div class="space-y-2">
      <Label for="data-module-color">Data Module Color</Label>
      <Input id="data-module-color" type="color" bind:value={colors.dataModuleColor} class="h-10" />
    </div>
  </div>

  <Separator />

  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <Label for="gradient-enabled">Use Gradient Fill</Label>
      <Checkbox id="gradient-enabled" bind:checked={gradient.enabled} />
    </div>

    {#if gradient.enabled}
      <div class="space-y-4 pl-4 border-l-2">
        <div class="space-y-2">
          <Label for="gradient-type">Gradient Type</Label>
          <select
            id="gradient-type"
            bind:value={gradient.type}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="gradient-start">Start Color</Label>
            <Input id="gradient-start" type="color" bind:value={gradient.start} class="h-10" />
          </div>
          <div class="space-y-2">
            <Label for="gradient-end">End Color</Label>
            <Input id="gradient-end" type="color" bind:value={gradient.end} class="h-10" />
          </div>
        </div>

        {#if gradient.type === 'linear'}
          <div class="space-y-2">
            <Label for="gradient-angle">Gradient Angle</Label>
            <div class="flex items-center gap-2">
              <Slider id="gradient-angle" bind:value={angleArray} min={0} max={360} step={15} class="flex-1" />
              <span class="text-sm font-mono w-12 text-right">{angleArray[0]}°</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
