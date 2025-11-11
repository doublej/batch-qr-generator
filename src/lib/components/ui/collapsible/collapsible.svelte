<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import type { Snippet } from 'svelte'

  interface CollapsibleProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { open = $bindable(), onOpenChange, class: className, children, ...restProps }: CollapsibleProps = $props()
</script>

<CollapsiblePrimitive.Root bind:open {onOpenChange} class={cn('w-full', className)} {...restProps}>
  {@render children?.()}
</CollapsiblePrimitive.Root>
