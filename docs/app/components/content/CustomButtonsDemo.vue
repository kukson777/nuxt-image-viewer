<script setup lang="ts">
import type { ImageViewerButton } from 'nuxt-image-viewer'

// Custom buttons and arrows live, for this gallery only: an icon button that downloads
// the current image, a text one that opens the original, and Nuxt UI buttons as arrows
// in the #prev / #next slots
const buttons: ImageViewerButton[] = [
  {
    name: 'download',
    label: 'Download',
    icon: 'i-lucide-download',
    onClick: ({ item }) => {
      const link = document.createElement('a')
      link.href = item.src
      link.download = ''
      link.click()
    },
  },
  {
    name: 'original',
    text: 'Original',
    icon: 'i-lucide-external-link',
    onClick: ({ item }) => window.open(item.src, '_blank', 'noopener'),
  },
]

const images = [demoImages.aurora, demoImages.dunes, demoImages.bauhaus]
</script>

<template>
  <RecipeFrame hint="Open an image: two buttons of its own in the toolbar, and Nuxt UI buttons as arrows.">
    <ImageViewerGroup
      :options="{ buttons }"
      class="grid w-full grid-cols-3 gap-3"
    >
      <ZoomImage
        v-for="image in images"
        :key="image.src"
        v-bind="image"
        sizes="240px"
        format="webp"
        class="aspect-[4/3] w-full rounded-lg object-cover"
      />

      <template #prev>
        <UButton
          icon="i-lucide-arrow-left"
          size="xl"
        />
      </template>

      <template #next>
        <UButton
          icon="i-lucide-arrow-right"
          size="xl"
        />
      </template>
    </ImageViewerGroup>
  </RecipeFrame>
</template>
