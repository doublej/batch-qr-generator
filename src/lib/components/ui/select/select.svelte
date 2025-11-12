<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'
  import { type Snippet } from 'svelte'

  interface SelectProps {
    class?: string
    children?: Snippet
  }

  let { class: className, children, ...restProps }: SelectProps = $props()
</script>

<SelectPrimitive.Root {...restProps}>
  {@render children?.()}
</SelectPrimitive.Root>
