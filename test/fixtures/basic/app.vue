<script setup lang="ts">
import { useImageViewer } from '../../../src/runtime/composables/useImageViewer'
import type { ImageViewerOpenOptions } from '../../../src/runtime/types'

const viewer = useImageViewer()

function openFromCode() {
  void viewer.open(
    [{ src: '/b.svg', width: 800, height: 600 }, { src: '/c.svg', width: 800, height: 600 }],
    1,
    { labels: { close: 'Shut' }, idleDelay: 300, buttons: [] },
  )
}

// Options of one group only: its own button instead of the configured ones, no counter
const groupOptions: ImageViewerOpenOptions = {
  buttons: [{ name: 'group', text: 'Group button', onClick: () => {} }],
  ui: { counter: false },
}
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

    <ImageViewerGroup
      as="section"
      data-test-group
      :options="groupOptions"
    >
      <ZoomImage
        src="/a.svg"
        :width="800"
        :height="600"
      />

      <ZoomImage
        src="/b.svg"
        :width="800"
        :height="600"
      />

      <ZoomImage
        src="/c.svg"
        :width="800"
        :height="600"
      />

      <template #next>
        <button
          type="button"
          data-slot-arrow
        >
          <svg viewBox="0 0 24 24" />
        </button>
      </template>
    </ImageViewerGroup>

    <button
      id="open"
      type="button"
      @click="openFromCode"
    >
      Open
    </button>

    <span id="state">{{ viewer.isOpen.value }}:{{ viewer.index.value }}</span>
  </div>
</template>
