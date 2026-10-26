<script setup lang="ts">
// An image that opens full screen on click and from the keyboard (plugin.client.ts).
// Width and height are of the source: by them the viewer knows how far the image can
// be zoomed. The caption is shown under it in the viewer. Other attributes (class,
// sizes, loading, NuxtImg props) pass through to the image. Registered instead of
// ZoomImage.vue when @nuxt/image is installed
import { computed } from 'vue'
import { useRuntimeConfig } from '#imports'

const props = defineProps<{
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

// NuxtImg adds app.baseURL to the page copy itself; the full image the viewer opens is
// a plain URL, so a path from public/ needs the base too — or it 404s on a site
// served from a subfolder (GitHub Pages)
const { app } = useRuntimeConfig()
const fullSrc = computed(() => props.src.startsWith('/') && !props.src.startsWith('//')
  ? app.baseURL.replace(/\/$/, '') + props.src
  : props.src)
</script>

<template>
  <NuxtImg
    :src
    :width
    :height
    :alt="alt ?? caption ?? ''"
    tabindex="0"
    data-image-viewer
    :data-image-viewer-src="fullSrc"
    :data-image-viewer-width="width"
    :data-image-viewer-height="height"
    :data-image-viewer-caption="caption"
  />
</template>
