<script setup lang="ts">
// A gallery from an API: no thumbnails on the page, the viewer fades in and out.
// The "API" here is a list on the static site
const viewer = useImageViewer()

const photos = [demoImages.valleyPanorama, demoImages.aurora, demoImages.duskPortrait, demoImages.ocean, demoImages.bauhaus]
  .map(({ src, width, height, caption }) => ({ src: publicUrl(src), width, height, caption, alt: caption }))

function openAll() {
  void viewer.open(photos)
}
</script>

<template>
  <RecipeFrame hint="No thumbnails on the page — the viewer fades in with the whole list.">
    <UButton
      icon="i-lucide-images"
      @click="openAll"
    >
      View all {{ photos.length }} photos
    </UButton>
  </RecipeFrame>
</template>
