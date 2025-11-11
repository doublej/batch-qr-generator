<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import type { Snippet } from 'svelte'

  interface CollapsibleContentProps {
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { class: className, children, ...restProps }: CollapsibleContentProps = $props()
</script>

<CollapsiblePrimitive.Content class={cn('overflow-hidden transition-all', className)} {...restProps}>
  {@render children?.()}
</CollapsiblePrimitive.Content>
