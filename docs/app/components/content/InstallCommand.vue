<script setup lang="ts">
const props = withDefaults(defineProps<{
  command?: string
}>(), {
  command: 'npx nuxt module add nuxt-image-viewer',
})

const copied = ref(false)

async function copy() {
  await navigator.clipboard.writeText(props.command)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<template>
  <div class="w-full basis-full">
    <div class="flex max-w-md items-center gap-2 rounded-lg border border-default bg-elevated/50 py-1.5 pl-3 pr-1.5 font-mono text-sm">
      <span class="select-none text-primary">$</span>

      <span class="truncate text-highlighted">{{ command }}</span>

      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="copied ? 'Copied' : 'Copy the command'"
        class="ml-auto"
        @click="copy"
      />
    </div>
  </div>
</template>
