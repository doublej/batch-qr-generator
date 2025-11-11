<script lang="ts">
  import { Label as LabelPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type ComponentProps, type Snippet } from 'svelte'

  interface LabelProps extends ComponentProps<LabelPrimitive.Root> {
    class?: string
    children?: Snippet
  }

  let { class: className, children, ...restProps }: LabelProps = $props()
</script>

<LabelPrimitive.Root
  class={cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</LabelPrimitive.Root>
