<script setup lang="ts">
// A group of <ZoomImage> for the docs pages: `images` are names from utils/demoImages.ts
const props = withDefaults(defineProps<{
  images?: DemoImageName[]
  columns?: 2 | 3 | 4
  rounded?: boolean
  group?: boolean
}>(), {
  images: () => ['alpineDawn', 'aurora', 'duskPortrait', 'dunes', 'bauhaus', 'bauhausSmall'],
  columns: 3,
  rounded: true,
  group: true,
})

const items = computed(() => props.images.map(name => demoImages[name]))
const grid = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }
</script>

<template>
  <div
    class="not-prose my-5 grid gap-3"
    :class="grid[columns]"
    :data-image-viewer-group="group ? '' : undefined"
  >
    <ZoomImage
      v-for="image in items"
      :key="image.src"
      :src="image.src"
      :width="image.width"
      :height="image.height"
      :caption="image.caption"
      sizes="320px"
      format="webp"
      class="aspect-[4/3] w-full object-cover ring ring-default transition hover:brightness-110"
      :class="rounded ? 'rounded-lg' : ''"
    />
  </div>
</template>
