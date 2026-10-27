<script setup lang="ts">
// Deep link: the open photo is in the URL as ?photo=N, and a link with it opens the
// viewer right away. Only this example's viewer writes to the URL
const route = useRoute()
const router = useRouter()
const viewer = useImageViewer()

const photos = [demoImages.alpineDawn, demoImages.aurora, demoImages.dunes, demoImages.ocean]
const thumbs = useTemplateRef<HTMLElement[]>('thumbs')
const ours = ref(false)

function open(index: number) {
  ours.value = true
  void viewer.open(photos.map((photo, i) => ({
    ...photo,
    src: publicUrl(photo.src),
    alt: photo.caption,
    element: thumbs.value?.[i]?.querySelector('img') ?? undefined,
  })), index)
}

onMounted(() => {
  const index = Number(route.query.photo)
  if (Number.isInteger(index) && photos[index])
    open(index)
})

watch([viewer.isOpen, viewer.index], ([isOpen, index]) => {
  if (!ours.value)
    return
  void router.replace({ query: isOpen ? { photo: index } : {}, hash: route.hash })
  if (!isOpen)
    ours.value = false
})

const link = computed(() => route.query.photo === undefined
  ? route.path
  : `${route.path}?photo=${route.query.photo}`)
</script>

<template>
  <RecipeFrame hint="Scroll the photos: the address follows. Reload the page with ?photo=2 — it opens on that photo.">
    <div class="grid w-full grid-cols-4 gap-3">
      <button
        v-for="(photo, i) in photos"
        ref="thumbs"
        :key="photo.src"
        type="button"
        class="cursor-zoom-in"
        :aria-label="`Open ${photo.caption}`"
        @click="open(i)"
      >
        <NuxtImg
          v-bind="photo"
          :alt="photo.caption"
          sizes="200px"
          format="webp"
          class="aspect-square w-full rounded-lg object-cover"
        />
      </button>
    </div>

    <code class="w-full truncate rounded-md bg-default px-2 py-1 text-sm">{{ link }}</code>
  </RecipeFrame>
</template>
