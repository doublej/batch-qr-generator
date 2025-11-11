<script lang="ts">
  import { cn } from '$lib/utils'

  interface SliderProps {
    class?: string
    value?: number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
  }

  let {
    class: className,
    value = $bindable([0]),
    min = 0,
    max = 100,
    step = 1,
    disabled = false
  }: SliderProps = $props()

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    value = [Number(target.value)]
  }
</script>

<div class={cn('relative flex w-full touch-none select-none items-center', className)}>
  <input
    type="range"
    {min}
    {max}
    {step}
    {disabled}
    value={value[0]}
    oninput={handleInput}
    class="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  />
</div>
