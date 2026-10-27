<script setup lang="ts">
// A product gallery on white: an opaque light backdrop, no counter or fullscreen, and
// no closing by a drag. The light theme goes on <html> only while this viewer is open
const viewer = useImageViewer()

const photos = [demoImages.bauhaus, demoImages.bauhausSmall, demoImages.dunes]
const thumbs = useTemplateRef<HTMLElement[]>('thumbs')

const theme = {
  '--image-viewer-bg': '#fff',
  '--image-viewer-color': '#111',
  '--image-viewer-button-bg': 'transparent',
  '--image-viewer-button-bg-hover': 'rgb(0 0 0 / 0.06)',
  '--image-viewer-caption-bg': 'rgb(255 255 255 / 0.9)',
}
const ours = ref(false)

function setTheme(on: boolean) {
  const style = document.documentElement.style
  for (const [key, value] of Object.entries(theme)) {
    if (on)
      style.setProperty(key, value)
    else
      style.removeProperty(key)
  }
}

function open(index: number) {
  ours.value = true
  setTheme(true)
  void viewer.open(photos.map((photo, i) => ({
    ...photo,
    src: publicUrl(photo.src),
    alt: photo.caption,
    element: thumbs.value?.[i]?.querySelector('img') ?? undefined,
  })), index, {
    bgOpacity: 1,
    closeOnVerticalDrag: false,
    ui: { counter: false, fullscreen: false },
  })
}

// Keep the theme through the closing animation
watch(viewer.isOpen, (isOpen) => {
  if (isOpen || !ours.value)
    return
  ours.value = false
  setTimeout(() => !viewer.isOpen.value && setTheme(false), 450)
})

onBeforeUnmount(() => setTheme(false))

function thumbClass(index: number) {
  return index === 0 ? 'col-span-3' : ''
}

function imageClass(index: number) {
  return index === 0 ? 'aspect-square' : 'aspect-[4/3]'
}
</script>

<template>
  <RecipeFrame hint="A white, opaque viewer without a counter — and it doesn't close when you drag the image.">
    <div class="flex w-full gap-4 rounded-lg bg-white p-4 text-neutral-900">
      <div class="grid w-1/2 grid-cols-3 gap-2">
        <button
          v-for="(photo, i) in photos"
          ref="thumbs"
          :key="photo.src"
          type="button"
          class="cursor-zoom-in"
          :class="thumbClass(i)"
          :aria-label="`Open ${photo.caption}`"
          @click="open(i)"
        >
          <NuxtImg
            v-bind="photo"
            :alt="photo.caption"
            sizes="320px"
            format="webp"
            class="w-full rounded-md object-cover"
            :class="imageClass(i)"
          />
        </button>
      </div>

      <div class="flex flex-1 flex-col gap-2">
        <p class="text-lg font-semibold">
          Bauhaus print
        </p>

        <p class="text-sm text-neutral-500">
          Giclée print on matte paper, 50 × 50 cm.
        </p>

        <p class="mt-auto text-xl font-bold">
          €49
        </p>
      </div>
    </div>
  </RecipeFrame>
</template>
