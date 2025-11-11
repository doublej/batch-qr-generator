<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import type { Snippet } from 'svelte'

  interface TabsListProps {
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { class: className, children, ...restProps }: TabsListProps = $props()
</script>

<TabsPrimitive.List
  class={cn(
    'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</TabsPrimitive.List>
