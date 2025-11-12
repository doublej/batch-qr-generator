<script lang="ts">
  import { Checkbox as CheckboxPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils'

  interface CheckboxProps {
    class?: string
    checked?: boolean
    id?: string
    onCheckedChange?: (checked: boolean) => void
  }

  let { class: className, checked = $bindable(false), ...restProps }: CheckboxProps = $props()
</script>

<CheckboxPrimitive.Root
  bind:checked
  class={cn(
    'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    className
  )}
  {...restProps}
>
  {#snippet children()}
    {#if checked}
      <span class="flex items-center justify-center text-current text-xs">✓</span>
    {/if}
  {/snippet}
</CheckboxPrimitive.Root>
