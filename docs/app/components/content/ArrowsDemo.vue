<script setup lang="ts">
// Arrows of your own, live: Nuxt UI buttons with a text in the #prev / #next slots of
// this gallery. Nothing is bound to them — the viewer places them, scrolls on a click
// and, with the strip not endless, dims Back on the first image and Next on the last
const images = [demoImages.valleyPanorama, demoImages.nightSky, demoImages.duskPortrait, demoImages.bauhaus]
</script>

<template>
  <RecipeFrame hint="Open an image: Back and Next are Nuxt UI buttons from the template. The strip isn't endless — Back is off on the first image, Next on the last.">
    <ImageViewerGroup
      :options="{ loop: false }"
      class="grid w-full grid-cols-4 gap-3"
    >
      <ZoomImage
        v-for="image in images"
        :key="image.src"
        v-bind="image"
        sizes="200px"
        format="webp"
        class="aspect-square w-full rounded-lg object-cover"
      />

      <template #prev>
        <UButton
          icon="i-lucide-arrow-left"
          label="Back"
          size="lg"
          color="primary"
        />
      </template>

      <template #next>
        <UButton
          trailing-icon="i-lucide-arrow-right"
          label="Next"
          size="lg"
          color="primary"
        />
      </template>
    </ImageViewerGroup>
  </RecipeFrame>
</template>
