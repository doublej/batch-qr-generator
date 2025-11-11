<script lang="ts">
  import { cn } from '$lib/utils'
  import { type Snippet } from 'svelte'

  interface CardProps {
    class?: string
    children?: Snippet
    [key: string]: any
  }

  let { class: className, children, ...restProps }: CardProps = $props()
</script>

<div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...restProps}>
  {@render children?.()}
</div>
