<script lang="ts">
  import { fade, scale } from 'svelte/transition'
  import { Progress } from '$lib/components/ui/progress'
  import { Button } from '$lib/components/ui/button'
  import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-svelte'
  import type { QRGenerationProgress } from '../lib/qr-worker-utils'
  import { _ } from '../lib/i18n'

  let {
    open = $bindable(),
    progress = $bindable<QRGenerationProgress>(),
    onCancel
  }: {
    open: boolean
    progress: QRGenerationProgress
    onCancel?: () => void
  } = $props()

  const statusIcons = {
    idle: null,
    generating: Loader2,
    compressing: Loader2,
    completed: CheckCircle,
    error: AlertCircle
  }

  const getStatusMessage = (status: string) => {
    const keys = {
      idle: 'progressModal.preparing',
      generating: 'progressModal.generating',
      compressing: 'progressModal.compressing',
      completed: 'progressModal.completed',
      error: 'progressModal.error'
    }
    return $_(keys[status as keyof typeof keys] || 'progressModal.preparing')
  }

  const Icon = $derived(statusIcons[progress.status])
  const isComplete = $derived(progress.status === 'completed')
  const hasError = $derived(progress.status === 'error')
  const isProcessing = $derived(progress.status === 'generating' || progress.status === 'compressing')
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 150 }}
  >
    <div class="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
      <div
        transition:scale={{ duration: 150, start: 0.95 }}
        class="grid w-full max-w-md gap-4 border bg-background p-6 shadow-lg rounded-lg"
      >
        <div class="space-y-2">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            {#if Icon}
              <Icon
                class="w-5 h-5 {isProcessing ? 'animate-spin' : ''} {hasError ? 'text-red-500' : isComplete ? 'text-green-500' : 'text-blue-500'}"
              />
            {/if}
            {getStatusMessage(progress.status)}
          </h2>
          <p class="text-sm text-muted-foreground">
            {#if progress.message}
              {progress.message}
            {:else if isProcessing}
              {$_('progressModal.currentOfTotal', { values: { current: progress.current, total: progress.total } })}
            {:else if isComplete}
              {$_('progressModal.successfullyGenerated', { values: { total: progress.total } })}
            {:else if hasError}
              {$_('progressModal.failedGenerate')}
            {/if}
          </p>
        </div>

        <div class="space-y-4">
          {#if !hasError}
            <Progress value={progress.percentage} max={100} class="w-full" />

            <div class="flex justify-between text-sm text-muted-foreground">
              <span>{progress.percentage}%</span>
              <span>
                {progress.current}/{progress.total}
              </span>
            </div>
          {/if}

          {#if hasError && progress.message}
            <div class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-800">{progress.message}</p>
            </div>
          {/if}

          <div class="flex justify-end gap-2">
            {#if isProcessing && onCancel}
              <Button variant="outline" onclick={onCancel}>
                <X class="w-4 h-4 mr-2" />
                {$_('progressModal.cancel')}
              </Button>
            {/if}

            {#if isComplete || hasError}
              <Button onclick={() => (open = false)}>{$_('progressModal.close')}</Button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}