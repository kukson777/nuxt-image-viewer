<script setup lang="ts">
// Colour mode button that renders on the server: both icons are in the markup and CSS
// shows the right one by the .dark class, which color-mode sets before the first paint.
// UColorModeButton waits for the client and leaves a placeholder until then
const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    aria-label="Toggle colour mode"
    @click="toggle"
  >
    <template #leading>
      <UIcon
        name="i-lucide-sun"
        class="size-5 dark:hidden"
      />

      <UIcon
        name="i-lucide-moon"
        class="hidden size-5 dark:inline-block"
      />
    </template>
  </UButton>
</template>
