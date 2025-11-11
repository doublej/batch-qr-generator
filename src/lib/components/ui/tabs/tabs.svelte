<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import type { Snippet } from 'svelte'

  interface TabsProps {
    value?: string
    onValueChange?: (value: string) => void
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { value = $bindable(), onValueChange, class: className, children, ...restProps }: TabsProps = $props()
</script>

<TabsPrimitive.Root bind:value onValueChange={onValueChange} class={cn('w-full', className)} {...restProps}>
  {@render children?.()}
</TabsPrimitive.Root>
