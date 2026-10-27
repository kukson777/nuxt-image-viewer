<script setup lang="ts">
// Each image in its own group: it opens alone, without a strip to scroll
const images = [demoImages.nightSky, demoImages.bauhaus]
</script>

<template>
  <RecipeFrame hint="Each image opens alone — no counter, no arrows, nothing to swipe to.">
    <figure
      v-for="image in images"
      :key="image.src"
      class="flex-1"
      data-image-viewer-group
    >
      <ZoomImage
        v-bind="image"
        sizes="320px"
        format="webp"
        class="aspect-[4/3] w-full rounded-lg object-cover"
      />

      <figcaption class="mt-2 text-sm text-muted">
        {{ image.caption }}
      </figcaption>
    </figure>
  </RecipeFrame>
</template>
