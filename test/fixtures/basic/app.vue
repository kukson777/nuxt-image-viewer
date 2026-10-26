<script setup lang="ts">
import { useImageViewer } from '../../../src/runtime/composables/useImageViewer'

const viewer = useImageViewer()
</script>

<template>
  <div>
    <div data-image-viewer-group>
      <ZoomImage
        src="/a.svg"
        :width="800"
        :height="600"
        caption="First"
      />

      <ZoomImage
        src="/b.svg"
        :width="800"
        :height="600"
        caption="Second"
      />

      <ZoomImage
        src="/c.svg"
        :width="800"
        :height="600"
      />
    </div>

    <button
      id="open"
      type="button"
      @click="viewer.open([{ src: '/b.svg', width: 800, height: 600 }, { src: '/c.svg', width: 800, height: 600 }], 1, { labels: { close: 'Shut' } })"
    >
      Open
    </button>

    <span id="state">{{ viewer.isOpen.value }}:{{ viewer.index.value }}</span>
  </div>
</template>
