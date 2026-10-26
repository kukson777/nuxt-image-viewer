<script setup lang="ts">
import type { ImageViewerItem } from 'nuxt-image-viewer'

const gallery = [
  { src: '/images/dawn.jpg', width: 2400, height: 1600, caption: 'Dawn over the ridges' },
  { src: '/images/valley.jpg', width: 3000, height: 1500, caption: 'A wide valley — panorama' },
  { src: '/images/dusk.jpg', width: 1600, height: 2400, caption: 'Dusk, portrait orientation' },
  { src: '/images/tiles.jpg', width: 2000, height: 2000 },
  { src: '/images/small.jpg', width: 640, height: 400, caption: 'A small image still zooms 2×' },
]

const viewer = useImageViewer()

// Opened from code: no thumbnails on the page, so the viewer fades in and out
const fromCode: ImageViewerItem[] = gallery.map(({ src, caption }) => ({ src, caption, alt: caption }))

function openFromCode() {
  void viewer.open(fromCode, 2, {
    loop: false,
    bgOpacity: 1,
    ui: { fullscreen: false },
    labels: { close: 'Close the gallery' },
  })
}

const theme = ref<'default' | 'light' | 'brand'>('default')
watch(theme, value => document.documentElement.dataset.viewerTheme = value)
</script>

<template>
  <div class="page">
    <header class="header">
      <strong>nuxt-image-viewer</strong>

      <label>
        Viewer theme
        <select v-model="theme">
          <option value="default">Default</option>

          <option value="light">Light (CSS variables)</option>

          <option value="brand">Brand (CSS variables)</option>
        </select>
      </label>
    </header>

    <main class="content">
      <section>
        <h2>Gallery — <code>&lt;ZoomImage&gt;</code> in a group</h2>

        <p>Click, Enter or Space opens the viewer. It scrolls through this group only.</p>

        <div
          class="grid"
          data-image-viewer-group
        >
          <ZoomImage
            v-for="image in gallery"
            :key="image.src"
            v-bind="image"
            class="thumb"
            loading="lazy"
          />
        </div>
      </section>

      <section>
        <h2>Plain <code>&lt;img&gt;</code> with data attributes</h2>

        <p>No component needed — mark any image. Two images: no endless strip, the arrows stop at the edges.</p>

        <div
          class="row"
          data-image-viewer-group
        >
          <img
            src="/images/dawn.jpg"
            alt="Dawn"
            width="2400"
            height="1600"
            tabindex="0"
            class="thumb thumb--round"
            data-image-viewer
            data-image-viewer-caption="Rounded thumbnail — the corners morph on open"
          >

          <img
            src="/images/tiles.jpg"
            alt="Tiles"
            width="2000"
            height="2000"
            tabindex="0"
            class="thumb thumb--round"
            data-image-viewer
          >
        </div>
      </section>

      <section>
        <h2><code>useImageViewer()</code></h2>

        <p>Open from code with per-call options: no loop, opaque backdrop, no fullscreen button, own label.</p>

        <div class="row">
          <button
            type="button"
            class="action"
            @click="openFromCode"
          >
            Open from code
          </button>

          <button
            type="button"
            class="action"
            @click="viewer.open({ src: '/images/valley.jpg' })"
          >
            Open one image without a size
          </button>
        </div>

        <p class="status">
          isOpen: <code>{{ viewer.isOpen.value }}</code>, index: <code>{{ viewer.index.value }}</code>
        </p>
      </section>

      <section class="spacer">
        <p>Scroll the page while the viewer is open — it's locked; and close it with a thumbnail scrolled off screen.</p>
      </section>
    </main>

    <button
      type="button"
      class="chat-bubble"
      aria-label="Chat"
    >
      💬
    </button>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #1f2937;
  background: #f8fafc;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.content {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.thumb {
  display: block;
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
}

.row .thumb {
  width: 240px;
}

.thumb--round {
  border-radius: 24px;
}

.action {
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: #1f2937;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.spacer {
  min-height: 120vh;
}

.chat-bubble {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  background: #2563eb;
  font-size: 24px;
}

[data-viewer-theme='light'] {
  --image-viewer-bg: #fff;
  --image-viewer-color: #111827;
  --image-viewer-button-bg: rgb(0 0 0 / 0.06);
  --image-viewer-button-bg-hover: rgb(0 0 0 / 0.12);
  --image-viewer-caption-bg: rgb(255 255 255 / 0.85);
  --image-viewer-focus-color: #111827;
}

[data-viewer-theme='brand'] {
  --image-viewer-bg: #1e1b4b;
  --image-viewer-button-bg: #f59e0b;
  --image-viewer-button-bg-hover: #fbbf24;
  --image-viewer-button-color: #1e1b4b;
  --image-viewer-button-radius: 12px;
  --image-viewer-button-size: 48px;
  --image-viewer-caption-bg: #f59e0b;
  --image-viewer-caption-color: #1e1b4b;
  --image-viewer-focus-color: #f59e0b;
}
</style>
