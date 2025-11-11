<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import type { Snippet } from 'svelte'

  interface CollapsibleTriggerProps {
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { class: className, children, ...restProps }: CollapsibleTriggerProps = $props()
</script>

<CollapsiblePrimitive.Trigger class={cn('', className)} {...restProps}>
  {@render children?.()}
</CollapsiblePrimitive.Trigger>
