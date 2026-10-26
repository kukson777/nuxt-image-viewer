<script setup lang="ts">
// Bento grid of the landing hero: every tile is a <ZoomImage>, so the hero is the demo.
// Tiles crop their images (object-cover) — the viewer flies back into the crop
const tiles = [
  { ...demoImages.alpineDawn, class: 'col-span-2 row-span-2' },
  { ...demoImages.aurora, class: '' },
  { ...demoImages.duskPortrait, class: 'row-span-2' },
  { ...demoImages.dunes, class: '' },
  { ...demoImages.ocean, class: 'col-span-2' },
  { ...demoImages.bauhaus, class: '' },
  { ...demoImages.nightSky, class: '' },
]
</script>

<template>
  <div class="relative">
    <div
      class="grid grid-cols-4 auto-rows-[88px] sm:auto-rows-[120px] xl:auto-rows-[136px] gap-2 sm:gap-3"
      data-image-viewer-group
    >
      <ZoomImage
        v-for="tile in tiles"
        :key="tile.src"
        :src="tile.src"
        :width="tile.width"
        :height="tile.height"
        :caption="tile.caption"
        sizes="320px md:400px"
        format="webp"
        class="size-full object-cover rounded-xl shadow-sm ring ring-default transition hover:brightness-110"
        :class="tile.class"
      />
    </div>

    <div class="pointer-events-none absolute -top-3 right-3 flex items-center gap-1.5 rounded-full bg-default/90 px-3 py-1 text-xs font-medium text-highlighted shadow ring ring-default backdrop-blur">
      <UIcon
        name="i-lucide-mouse-pointer-click"
        class="size-3.5 text-primary"
      />
      Click any image
    </div>
  </div>
</template>
