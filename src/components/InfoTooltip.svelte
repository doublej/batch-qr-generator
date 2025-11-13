<script lang="ts">
  import { Info } from 'lucide-svelte'
  import { cn } from '$lib/utils'

  type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

  interface Props {
    text: string
    side?: TooltipSide
    class?: string
  }

  let {
    text,
    side = 'top',
    class: className
  }: Props = $props()

  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`
  let hovered = $state(false)
  let focused = $state(false)

  const positionMap: Record<TooltipSide, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  }

  const open = $derived(hovered || focused)
  const positionClasses = $derived(positionMap[side])
</script>

<div class={cn('relative inline-flex items-center', className)}>
  <button
    type="button"
    aria-describedby={tooltipId}
    class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-muted-foreground/80 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    onmouseenter={() => (hovered = true)}
    onmouseleave={() => (hovered = false)}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
  >
    <Info class="h-3.5 w-3.5" aria-hidden="true" />
    <span class="sr-only">Show help</span>
  </button>

  {#if open}
    <div
      id={tooltipId}
      role="tooltip"
      class={cn(
        'pointer-events-none absolute z-50 min-w-[20rem] max-w-[64rem] rounded-md border border-border/60 bg-popover px-3 py-1.5 text-[10px] leading-snug text-popover-foreground text-left shadow-lg whitespace-normal',
        positionClasses
      )}
    >
      {text}
    </div>
  {/if}
</div>
