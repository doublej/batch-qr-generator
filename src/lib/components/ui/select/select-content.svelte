<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type Snippet } from 'svelte'

  interface SelectContentProps {
    class?: string
    children?: Snippet
  }

  let { class: className, children, ...restProps }: SelectContentProps = $props()
</script>

<SelectPrimitive.Content
  class={cn(
    'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
    className
  )}
  {...restProps}
>
  <SelectPrimitive.Viewport class="p-1">
    {@render children?.()}
  </SelectPrimitive.Viewport>
</SelectPrimitive.Content>
