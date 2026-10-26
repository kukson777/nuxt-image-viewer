<script setup lang="ts">
// useImageViewer() live: no thumbnails on the page, so the viewer fades in and out
const viewer = useImageViewer()

const items = [demoImages.valleyPanorama, demoImages.ocean, demoImages.nightSky, demoImages.bauhaus]
  .map(({ src, width, height, caption }) => ({ src: publicUrl(src), width, height, caption, alt: caption }))

function openGallery() {
  void viewer.open(items)
}

function openCustom() {
  void viewer.open(items, 2, {
    loop: false,
    bgOpacity: 1,
    ui: { fullscreen: false, counter: false },
    labels: { close: 'Back to the docs' },
  })
}
</script>

<template>
  <div class="not-prose my-5 flex flex-col gap-4 rounded-lg border border-default bg-elevated/40 p-4 sm:flex-row sm:items-center">
    <div class="flex flex-wrap gap-2">
      <UButton
        icon="i-lucide-images"
        @click="openGallery"
      >
        open(items)
      </UButton>

      <UButton
        icon="i-lucide-sliders-horizontal"
        color="neutral"
        variant="outline"
        @click="openCustom"
      >
        open(items, 2, options)
      </UButton>
    </div>

    <div class="flex gap-2 text-sm sm:ml-auto">
      <UBadge
        color="neutral"
        variant="subtle"
        class="font-mono"
      >
        isOpen: {{ viewer.isOpen.value }}
      </UBadge>

      <UBadge
        color="neutral"
        variant="subtle"
        class="font-mono"
      >
        index: {{ viewer.index.value }}
      </UBadge>
    </div>
  </div>
</template>
