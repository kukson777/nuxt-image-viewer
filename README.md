# nuxt-image-viewer

[![npm version][npm-version-src]][npm-version-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Full-screen image viewer (lightbox) for Nuxt. The image expands from its place on the page, scrolls with swipes, arrows and keys in an endless strip, zooms with a click, double tap, wheel or pinch, closes with a drag down — and flies back to its place. Springs, inertia and tuned gesture thresholds make it feel like a native photo app.

**[Documentation and live demo →](https://kukson777.github.io/nuxt-image-viewer/)**

- No dependencies besides Nuxt — plain Vue, plain CSS, inline SVG icons
- Mark images with `<ZoomImage>` or a `data-image-viewer` attribute — no handlers in place
- Open from code with `useImageViewer()` — with or without thumbnails on the page
- Options in `nuxt.config` and per call, CSS variables, BEM classes, a cascade layer
- Dialog semantics, keyboard, focus trap and return, reduced motion
- Pointer events: the same gestures for mouse and touch, no empty frames at any swiping pace

## Setup

```bash
npx nuxt module add nuxt-image-viewer
```

or install it yourself and add it to `modules`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-image-viewer'],
  imageViewer: {
    // options, all optional — see below
  },
})
```

## Usage

### `<ZoomImage>`

```vue
<template>
  <article data-image-viewer-group>
    <ZoomImage src="/photos/a.jpg" :width="2400" :height="1600" caption="Dawn" />
    <ZoomImage src="/photos/b.jpg" :width="1600" :height="2400" alt="Dusk" />
  </article>
</template>
```

| Prop | Type | |
| --- | --- | --- |
| `src` | `string` | Full-size image. |
| `width`, `height` | `number` | Natural size of `src` — the viewer fits and zooms by it. |
| `caption` | `string?` | Shown under the image in the viewer; also the default `alt`. |
| `alt` | `string?` | |

Other attributes (`class`, `loading`, `sizes`, …) pass through to the `<img>`. With [`@nuxt/image`](https://image.nuxt.com) installed the component renders `<NuxtImg>`: the page shows an optimized copy, the viewer the full image (see `nuxtImage`).

Click, Enter and Space open the viewer. It scrolls through the images of the closest `[data-image-viewer-group]`, without one — through every image of the page.

### `<ImageViewerGroup>`

A group with options of its own — anything `open()` takes, for its images only, on top of the global options:

```vue
<template>
  <ImageViewerGroup :options="{ loop: false, ui: { counter: false } }">
    <ZoomImage v-for="photo in photos" :key="photo.src" v-bind="photo" />
  </ImageViewerGroup>
</template>
```

It renders a `<div data-image-viewer-group>`; `as="section"` makes it another tag. Its `#prev` / `#next` slots are arrows of your own — see below.

### Plain `<img>`

The component only sets attributes — any image can be marked:

```html
<img
  src="/photos/a-small.jpg"
  alt="Dawn"
  tabindex="0"
  data-image-viewer
  data-image-viewer-src="/photos/a.jpg"
  data-image-viewer-width="2400"
  data-image-viewer-height="1600"
  data-image-viewer-caption="Dawn over the ridges"
>
```

| Attribute | |
| --- | --- |
| `data-image-viewer` | Opens the viewer. Only `<img>` elements. |
| `data-image-viewer-src` | Full image. Defaults to the image on the page (`currentSrc`). |
| `data-image-viewer-width` / `-height` | Natural size of the full image. Defaults to the page image's natural size. |
| `data-image-viewer-caption` | Caption. |
| `data-image-viewer-group` | On a container: scroll through its images only. |

### `useImageViewer()`

Open the viewer from code with your own list of images. A page element for an image is optional: with `element` the image flies out of it and back, without one the viewer fades in and out.

```ts
const viewer = useImageViewer()

viewer.open(
  [
    { src: '/photos/a.jpg', width: 2400, height: 1600, caption: 'Dawn' },
    { src: '/photos/b.jpg', width: 1600, height: 2400, element: thumbRef.value },
  ],
  1, // start index
  { loop: false, bgOpacity: 1, ui: { fullscreen: false } }, // overrides for this call
)

watch(viewer.index, i => console.log('now at', i))
```

| Member | Type | |
| --- | --- | --- |
| `open(items, index?, options?)` | `Promise<void>` | Open. `items` is an array or a single item. Ignored while open. |
| `configure(options)` | `void` | Options for every viewer from now on, on top of `nuxt.config` — including ones opened by a click. The place for custom `buttons` and `controls`. |
| `close()` | `void` | Close with the animation. |
| `next()`, `prev()`, `goTo(index)` | `void` | Scroll. `goTo` takes the shortest way round the endless strip. |
| `isOpen` | `Readonly<Ref<boolean>>` | `true` from `open()` until closing starts. |
| `index` | `Readonly<Ref<number>>` | Current image. |
| `items` | `Readonly<Ref<ImageViewerSlide[]>>` | Images of the open viewer. |

`ImageViewerItem`:

| Field | Type | |
| --- | --- | --- |
| `src` | `string` | Full image. The only required field. |
| `width`, `height` | `number?` | Natural size. Without it the image is loaded to measure it first, so the viewer opens a bit later. |
| `thumb` | `string?` | Copy shown at once while `src` loads. Defaults to `element.currentSrc`, else `src`. |
| `alt`, `caption` | `string?` | |
| `element` | `HTMLElement?` | Page element to open from and close into. |

On the server `useImageViewer()` returns a no-op (`isOpen` is `false`). All types are exported: `import type { ImageViewerItem, ImageViewerOpenOptions } from 'nuxt-image-viewer'`.

## Options

`nuxt.config` → `imageViewer`. Options marked *per call* can also be passed to `open()`.

| Option | Default | |
| --- | --- | --- |
| `zIndex` | `1000` | z-index of the viewer layer. *Per call.* |
| `bgOpacity` | `0.8` | Backdrop opacity, 0–1. *Per call.* |
| `loop` | `true` | Endless strip. Needs at least 3 images. *Per call.* |
| `spacing` | `0.1` | Gap between slides, share of the viewport width. *Per call.* |
| `maxZoom` | `4` | Zoom limit relative to the fitted image. Images zoom up to their natural size but at least 2×. *Per call.* |
| `closeOnVerticalDrag` | `true` | Close by dragging up or down. *Per call.* |
| `closeOnBackdropClick` | `true` | Close by a click outside the image. *Per call.* |
| `idleDelay` | `4000` | Fade the controls out after the mouse rests this long, ms. `0` keeps them. Mouse devices only. *Per call.* |
| `idleHidesCaption` | `true` | Fade the caption out with the controls; `false` leaves the image with its caption. *Per call.* |
| `ui` | all `true` | `{ counter, zoom, fullscreen, close, arrows, caption }` — which controls to show. *Per call, partial.* |
| `labels` | English | `{ dialog, close, zoomIn, zoomOut, fullscreen, exitFullscreen, prev, next }` — accessible names. *Per call, partial.* |
| `openClass` | `'image-viewer-open'` | Class on `<html>` while open. |
| `hide` | `[]` | Selectors hidden while open, e.g. `['jdiv', '#intercom-container']`. |
| `autoOpen` | `true` | Open on click/Enter/Space on `img[data-image-viewer]`. `false` — only from code. |
| `componentName` | `'ZoomImage'` | Name of the image component. `false` — don't register it. |
| `nuxtImage` | `'auto'` | Render `<NuxtImg>` in the component. `'auto'` — when `@nuxt/image` is installed. |
| `css` | `true` | Include the default styles. |

Runtime options are also in `useRuntimeConfig().public.imageViewer`, so they can be overridden with `NUXT_PUBLIC_IMAGE_VIEWER_*` environment variables.

## Custom buttons and arrows

Add buttons of your own to the toolbar, before the built-in ones: an icon, a text, or both. Replace the prev / next arrows with your own components. They hold functions and components, so they're set from code — for one gallery in `<ImageViewerGroup>`, for one viewer in `open()`, or for every viewer with `configure()` in a client plugin. The closer setting wins.

```vue
<script setup lang="ts">
import type { ImageViewerButton } from 'nuxt-image-viewer'

defineProps<{ photos: { src: string, width: number, height: number }[] }>()

// Only for the viewer of this gallery: a button, and arrows as #prev / #next slots
const download: ImageViewerButton = {
  name: 'download',
  label: 'Download',
  icon: 'i-lucide-download',
  onClick: ({ item }) => window.open(item.src),
}
</script>

<template>
  <ImageViewerGroup :options="{ buttons: [download] }">
    <ZoomImage v-for="photo in photos" :key="photo.src" v-bind="photo" />

    <template #next>
      <UButton icon="i-lucide-arrow-right" size="xl" />
    </template>
  </ImageViewerGroup>
</template>
```

For every viewer on the site — no `<ImageViewerGroup>` needed:

```ts
// plugins/image-viewer.client.ts
import { UButton } from '#components'

// For every viewer on the site: a click on any <ZoomImage>, and open() from code
export default defineNuxtPlugin(() => {
  useImageViewer().configure({
    buttons: [
      {
        name: 'download', // class modifier: .image-viewer__button--download
        label: 'Download', // accessible name, required for an icon-only button
        icon: 'i-lucide-download', // Nuxt Icon name (Nuxt UI includes it), or any component
        onClick: ({ item, index, close }) => {
          const link = document.createElement('a')
          link.href = item.src
          link.download = ''
          link.click()
        },
      },
      {
        name: 'share',
        text: 'Share', // a pill with text, which is also its accessible name
        onClick: ({ item }) => navigator.share?.({ url: item.src }),
      },
    ],
    // Arrows of your own need no props: the viewer places them, scrolls on their
    // click and names an icon-only button from the labels
    controls: {
      prev: () => h(UButton, { icon: 'i-lucide-arrow-left' }),
      next: () => h(UButton, { icon: 'i-lucide-arrow-right' }),
    },
  })
})
```

## Styling

### CSS variables

Set them on `:root`, on `.image-viewer` or on any ancestor.

| Variable | Default | |
| --- | --- | --- |
| `--image-viewer-bg` | `#000` | Backdrop colour (its opacity is `bgOpacity`). |
| `--image-viewer-color` | `#fff` | Text and icons. |
| `--image-viewer-font` | `inherit` | Font family. |
| `--image-viewer-counter-color` | `--image-viewer-color` | |
| `--image-viewer-button-bg` | `rgb(255 255 255 / 0.12)` | |
| `--image-viewer-button-bg-hover` | `rgb(255 255 255 / 0.22)` | Also on press. |
| `--image-viewer-button-color` | `--image-viewer-color` | |
| `--image-viewer-button-size` | `44px` | |
| `--image-viewer-button-radius` | `9999px` | |
| `--image-viewer-icon-size` | `24px` | |
| `--image-viewer-caption-bg` | `rgb(0 0 0 / 0.6)` | |
| `--image-viewer-caption-color` | `--image-viewer-color` | |
| `--image-viewer-caption-radius` | `8px` | |
| `--image-viewer-caption-font-size` | `14px` | |
| `--image-viewer-focus-color` | `#fff` in the viewer, `#2563eb` on page images | Focus ring. |

```css
:root {
  --image-viewer-bg: #fff;
  --image-viewer-color: #111827;
  --image-viewer-button-bg: rgb(0 0 0 / 0.06);
  --image-viewer-button-radius: 12px;
}
```

### BEM classes

The default styles live in the `image-viewer` cascade layer, so any unlayered rule of yours wins without `!important`. The layer is declared after `base`, so Tailwind's preflight doesn't break the viewer images. Or turn them off with `css: false` and style from scratch:

| Class | |
| --- | --- |
| `.image-viewer` | Dialog layer, `100vw` × `100%`. Modifiers: `--zoomed`, `--closing`, `--idle` (controls faded out), `--idle-caption` (caption too). |
| `.image-viewer__backdrop` | Backdrop; its opacity is set inline. |
| `.image-viewer__track` | Strip, moved by `transform`. |
| `.image-viewer__slide` | One slide. Modifier: `--current`. |
| `.image-viewer__frame` | Fitted image box; positioned inline. |
| `.image-viewer__zoom` | Zoomed and panned layer. |
| `.image-viewer__img` | Images. Modifiers: `--thumb` (page copy), `--full`, `--loaded`. |
| `.image-viewer__ui` | Controls layer. |
| `.image-viewer__toolbar` | Top bar. |
| `.image-viewer__counter` | `2 / 5`. |
| `.image-viewer__buttons` | Button group in the toolbar. |
| `.image-viewer__button` | Every button. Modifiers: `--zoom`, `--fullscreen`, `--close`. |
| `.image-viewer__arrow` | Prev / next (also `.image-viewer__button`). Modifiers: `--prev`, `--next`. Hidden on touch screens. |
| `.image-viewer__icon` | SVG icon, `stroke: currentColor`. |
| `.image-viewer__caption` | Caption container; `.image-viewer__caption-text` — its text. |

Page images get `cursor: zoom-in` and a focus ring via `[data-image-viewer]`.

## Gestures and keys

| | Mouse | Touch | Keyboard |
| --- | --- | --- | --- |
| Next / previous | drag sideways, arrow buttons | swipe | `←` `→` |
| Zoom | click, wheel, zoom button | double tap, pinch | — |
| Pan when zoomed | drag | drag | — |
| Close | click outside, drag up/down, close button | tap outside, drag up/down | `Esc` |

## Accessibility

- The viewer is a `role="dialog"` with `aria-modal` and a label; buttons have accessible names (`labels`).
- Focus moves into the dialog, `Tab` stays inside it, and on close focus returns to the page image (or to the element focused before `open()`).
- Page images are focusable (`tabindex="0"`) and open with Enter and Space; `alt` falls back to the caption.
- The counter is a polite live region; slides other than the current one are `aria-hidden`.
- With `prefers-reduced-motion: reduce` animations and springs are skipped.

## How it works

- The page is not edited: on the first open the plugin imports the viewer component and renders it into a container in `<body>` with the app context, and unmounts it after closing.
- While open, page scroll is locked. If `<html>` has no `scrollbar-gutter: stable`, the scrollbar width is compensated with `padding-right` on `<body>`, so the page doesn't jump. Fixed elements of your own may still need the same.
- Every slide is in the DOM: while the full image loads, the copy already loaded on the page is shown, so there are no empty frames.
- While open, the page image of the current slide is `visibility: hidden` — the viewer image flies out of its place instead of doubling it.

## For AI agents

- Mark images: `<ZoomImage src width height caption?>`; group with `data-image-viewer-group` on a container. Width/height are of the **full** image.
- Open from code: `useImageViewer().open(items, index?, options?)` — auto-imported, client-only, items need only `src`.
- Configure globally in `nuxt.config` → `imageViewer` (`ModuleOptions`); per call with `ImageViewerOpenOptions` (behaviour, `ui`, `labels`).
- Restyle with `--image-viewer-*` variables; deeper changes target `.image-viewer__*` classes (unlayered CSS wins), or `css: false`.
- Types: `ModuleOptions`, `ImageViewerItem`, `ImageViewerOpenOptions`, `ImageViewerApi`, `ImageViewerSlide`, `ImageViewerUi`, `ImageViewerLabels` from `'nuxt-image-viewer'`.

## Development

```bash
npm install
npm run dev:prepare  # stub the module, generate types
npm run dev          # playground on http://localhost:3000
npm run docs:dev     # documentation site (Docus) in docs/
npm run docs:build   # static documentation site in docs/.output/public
npm run lint
npm run test         # e2e: SSR + browser (local: system Edge, CI: Chromium)
npm run test:types
```

### Releasing

Release notes follow Nuxt: a **Highlights** part written by hand, then the changelog generated from conventional commits.

1. `npm run release:notes` — bumps the version from the commits and adds the generated section to `CHANGELOG.md`.
2. Write the highlights at the top of that section: a one-line summary, what's new with a short example each, and how to upgrade. Read the generated list too: a commit that brought several changes is one line there — give each change its own line, so the list shows everything the release has.
3. `npm run release` — lint and tests, then the release commit and tag, `npm publish`, push, and a GitHub release with the notes from `CHANGELOG.md`.

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-image-viewer/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-image-viewer

[license-src]: https://img.shields.io/npm/l/nuxt-image-viewer.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-image-viewer

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
