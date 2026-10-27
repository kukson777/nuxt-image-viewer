<script setup lang="ts">
// A chat widget in the corner of the screen, like Jivo or Intercom. The site hides
// `.demo-chat-bubble` with the `hide` option while the viewer is open
const images = [demoImages.alpineDawn, demoImages.ocean, demoImages.dunes]
</script>

<template>
  <RecipeFrame hint="Open an image — the chat bubble in the bottom right corner steps aside until you close it.">
    <div
      class="grid w-full grid-cols-3 gap-3"
      data-image-viewer-group
    >
      <ZoomImage
        v-for="image in images"
        :key="image.src"
        v-bind="image"
        sizes="240px"
        format="webp"
        class="aspect-[4/3] w-full rounded-lg object-cover"
      />
    </div>

    <Teleport to="body">
      <button
        type="button"
        class="demo-chat-bubble fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-inverted shadow-lg"
        aria-label="Chat (demo)"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="size-6"
        />
      </button>
    </Teleport>
  </RecipeFrame>
</template>
