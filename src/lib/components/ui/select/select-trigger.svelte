<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type ComponentProps } from 'svelte'

  interface SelectTriggerProps extends ComponentProps<SelectPrimitive.Trigger> {
    class?: string
  }

  let { class: className, ...restProps }: SelectTriggerProps = $props()
</script>

<SelectPrimitive.Trigger
  class={cn(
    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</SelectPrimitive.Trigger>
