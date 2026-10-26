<script setup lang="ts">
// Closing call to action. The fan of images is a live group too — click one.
// A hovered back card slides out from under its neighbour by the overlap (left cards to
// the left, right ones to the right) instead of jumping on top with z-index, which
// can't be animated. On that side only cards below it lie, so nothing else changes.
// Only translate and shadow transition — `visibility` must stay instant, the viewer
// hides the thumbnail with it while the image is open
const fan = [
  { ...demoImages.dunes, size: 'size-16 sm:size-24', layer: 'z-0', hover: 'hover:-translate-x-4 sm:hover:-translate-x-6' },
  { ...demoImages.aurora, size: 'size-20 sm:size-28', layer: 'z-10', hover: 'hover:-translate-x-4 sm:hover:-translate-x-6' },
  { ...demoImages.alpineDawn, size: 'size-24 sm:size-36', layer: 'z-20', hover: '' },
  { ...demoImages.ocean, size: 'size-20 sm:size-28', layer: 'z-10', hover: 'hover:translate-x-4 sm:hover:translate-x-6' },
  { ...demoImages.duskPortrait, size: 'size-16 sm:size-24', layer: 'z-0', hover: 'hover:translate-x-4 sm:hover:translate-x-6' },
]
</script>

<template>
  <div class="relative isolate overflow-hidden rounded-2xl border border-default bg-elevated/40 px-6 py-16 text-center sm:py-20">
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--ui-primary)_22%,transparent),transparent_65%)]" />

    <div class="absolute inset-0 -z-10 bg-[radial-gradient(var(--ui-border-accented)_1px,transparent_1px)] bg-size-[20px_20px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />

    <div
      class="mb-10 flex items-center justify-center"
      data-image-viewer-group
    >
      <ZoomImage
        v-for="(image, i) in fan"
        :key="image.src"
        :src="image.src"
        :width="image.width"
        :height="image.height"
        :caption="image.caption"
        sizes="160px"
        format="webp"
        class="rounded-2xl object-cover shadow-lg ring-4 ring-(--ui-bg) transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-2 hover:shadow-xl"
        :class="[image.size, image.layer, image.hover, i ? '-ml-4 sm:-ml-6' : '']"
      />
    </div>

    <h2 class="text-3xl font-bold text-balance text-highlighted sm:text-4xl">
      Ready when your images are
    </h2>

    <p class="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted">
      Add the module, mark your images, done. Everything else is optional.
    </p>

    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <UButton
        size="lg"
        to="/docs/getting-started/installation"
        trailing-icon="i-lucide-arrow-right"
      >
        Get started
      </UButton>

      <UButton
        size="lg"
        color="neutral"
        variant="outline"
        to="/docs/api/use-image-viewer"
      >
        Read the API
      </UButton>
    </div>
  </div>
</template>
