<script setup lang="ts">
// An image that opens full screen on click and from the keyboard (plugin.client.ts).
// Width and height are of the source: by them the viewer knows how far the image can
// be zoomed. The caption is shown under it in the viewer. Other attributes (class,
// sizes, loading, NuxtImg props) pass through to the image. Registered instead of
// ZoomImage.vue when @nuxt/image is installed
defineProps<{
  /** Full-size image. The page shows an optimized copy of it. */
  src: string
  /** Natural width of `src`. */
  width: number
  /** Natural height of `src`. */
  height: number
  /** Text shown under the image in the viewer. Used as `alt` when there is none. */
  caption?: string
  alt?: string
}>()
</script>

<template>
  <NuxtImg
    :src
    :width
    :height
    :alt="alt ?? caption ?? ''"
    tabindex="0"
    data-image-viewer
    :data-image-viewer-src="src"
    :data-image-viewer-width="width"
    :data-image-viewer-height="height"
    :data-image-viewer-caption="caption"
  />
</template>
