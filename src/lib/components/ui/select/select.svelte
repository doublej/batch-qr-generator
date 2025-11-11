<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type ComponentProps } from 'svelte'

  interface SelectProps extends ComponentProps<SelectPrimitive.Root> {
    class?: string
  }

  let { class: className, ...restProps }: SelectProps = $props()
</script>

<SelectPrimitive.Root {...restProps}>
  {@render children?.()}
</SelectPrimitive.Root>
