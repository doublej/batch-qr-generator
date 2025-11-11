<script lang="ts">
  import { Separator as SeparatorPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'

  interface SeparatorProps {
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
    class?: string
    [key: string]: any
  }

  let { orientation = 'horizontal', decorative = true, class: className, ...restProps }: SeparatorProps = $props()
</script>

<SeparatorPrimitive.Root
  {orientation}
  {decorative}
  class={cn(
    'shrink-0 bg-border',
    orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
    className
  )}
  {...restProps}
/>
