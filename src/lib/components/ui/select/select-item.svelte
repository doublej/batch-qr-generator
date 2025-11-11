<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type ComponentProps } from 'svelte'

  interface SelectItemProps extends ComponentProps<SelectPrimitive.Item> {
    class?: string
    value: string
    label?: string
  }

  let { class: className, value, label, ...restProps }: SelectItemProps = $props()
</script>

<SelectPrimitive.Item
  {value}
  {label}
  class={cn(
    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    className
  )}
  {...restProps}
>
  <SelectPrimitive.ItemIndicator class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
    <span>✓</span>
  </SelectPrimitive.ItemIndicator>
  {@render children?.()}
</SelectPrimitive.Item>
