<script setup lang="ts">
// Frame of a live example in the recipes: the example, and a hint what to try
defineProps<{
  hint: string
}>()
</script>

<template>
  <div class="not-prose my-5 overflow-hidden rounded-lg border border-default">
    <div class="flex flex-wrap items-center gap-3 bg-elevated/40 p-4">
      <slot />
    </div>

    <p class="flex items-center gap-1.5 border-t border-default px-4 py-2 text-sm text-muted">
      <UIcon
        name="i-lucide-mouse-pointer-click"
        class="size-4 shrink-0 text-primary"
      />
      {{ hint }}
    </p>
  </div>
</template>
