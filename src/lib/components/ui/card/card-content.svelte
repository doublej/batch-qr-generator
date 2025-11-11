<script lang="ts">
  import { cn } from '$lib/utils'
  import { type Snippet } from 'svelte'

  interface CardContentProps {
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { class: className, children, ...restProps }: CardContentProps = $props()
</script>

<div class={cn('p-6 pt-0', className)} {...restProps}>
  {@render children?.()}
</div>
