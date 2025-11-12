<script lang="ts">
  import { cn } from '$lib/utils'
  import { fade, scale } from 'svelte/transition'
  import type { HTMLAttributes } from 'svelte/elements'

  type Props = HTMLAttributes<HTMLDivElement> & {
    open: boolean
  }

  let { open, class: className, children, ...restProps }: Props = $props()

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      open = false
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
    role="button"
    tabindex="-1"
  >
    <div class="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
      <div
        transition:scale={{ duration: 150, start: 0.95 }}
        class={cn(
          'grid w-full gap-4 border bg-background p-6 shadow-lg rounded-lg',
          className
        )}
        {...restProps}
      >
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}