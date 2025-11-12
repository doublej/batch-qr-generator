<script lang="ts">
  import { Label as LabelPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type Snippet } from 'svelte'

  interface LabelProps {
    class?: string
    children?: Snippet
    for?: string
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
