# Changelog

## v1.1.0

> 1.1.0 is a minor release: buttons and arrows of your own, options for one gallery, and controls that step aside while you look at the image.

### 👀 Highlights

#### 🔘 Buttons of your own

The toolbar takes buttons of your own — download, share, anything. The icon is a Nuxt Icon name, as in `<UIcon name>`, or any component; with `text` the button becomes a pill. They sit before the built-in buttons, look the same and get the current image when clicked:

```ts
useImageViewer().configure({
  buttons: [
    {
      name: 'download',
      label: 'Download',
      icon: 'i-lucide-download',
      onClick: ({ item }) => window.open(item.src),
    },
  ],
})
```

👉 [Custom buttons](https://kukson777.github.io/nuxt-image-viewer/docs/customization/custom-buttons)

#### ➡️ Arrows of your own

Replace the prev / next arrows with your own buttons, right in the template. They need nothing bound to them: the viewer puts them in place, scrolls on their click, dims them at the ends of a strip that isn't endless and names an icon-only button from the labels:

```vue
<ImageViewerGroup>
  <ZoomImage v-for="photo in photos" :key="photo.src" v-bind="photo" />

  <template #next>
    <UButton icon="i-lucide-arrow-right" size="xl" />
  </template>
</ImageViewerGroup>
```

👉 [Your own arrows](https://kukson777.github.io/nuxt-image-viewer/docs/customization/custom-buttons#your-own-arrows)

#### 🖼️ Options for one gallery

`<ImageViewerGroup>` is a `data-image-viewer-group` with options of its own — anything `open()` takes, for the images inside only. No more opening a gallery from code just to give it its own settings:

```vue
<ImageViewerGroup :options="{ loop: false, ui: { counter: false } }">
  <ZoomImage v-for="photo in photos" :key="photo.src" v-bind="photo" />
</ImageViewerGroup>
```

#### 💤 Controls that step aside

Like in a photo app, the buttons, arrows and counter fade out when the mouse rests and come back on the next move or key. The caption fades too — or stays, with `idleHidesCaption: false`. Touch screens keep their controls.

```ts
export default defineNuxtConfig({
  imageViewer: {
    idleDelay: 3000,
    idleHidesCaption: false,
  },
})
```

#### ⚙️ `configure()`

`useImageViewer().configure()` sets options for every viewer from a client plugin. Unlike `nuxt.config` it takes functions and components — the place for buttons and arrows the whole site shares.

### ✅ Upgrading

```bash
npm install nuxt-image-viewer@latest
```

Nothing to change. One thing behaves differently: with a mouse, the controls now fade out after 4 seconds without a move. To keep them shown, set `idleDelay: 0`.

### 👉 Changelog

[compare changes](https://github.com/kukson777/nuxt-image-viewer/compare/v1.0.0...v1.1.0)

### 🚀 Enhancements

- Fade out the controls while the mouse rests: `idleDelay`, `idleHidesCaption` ([1bcb3ca](https://github.com/kukson777/nuxt-image-viewer/commit/1bcb3ca))
- Toolbar buttons of your own: `buttons`, with a Nuxt Icon name or a component as the icon, a text, or both ([1bcb3ca](https://github.com/kukson777/nuxt-image-viewer/commit/1bcb3ca))
- Prev / next arrows of your own: `controls`, and `#prev` / `#next` slots of `<ImageViewerGroup>` ([1bcb3ca](https://github.com/kukson777/nuxt-image-viewer/commit/1bcb3ca))
- `<ImageViewerGroup>` — a group of images with options of its own ([1bcb3ca](https://github.com/kukson777/nuxt-image-viewer/commit/1bcb3ca))
- `useImageViewer().configure()` — options for every viewer, functions and components included ([1bcb3ca](https://github.com/kukson777/nuxt-image-viewer/commit/1bcb3ca))

### 🩹 Fixes

- Add app.baseURL to the full image of ZoomImage with Nuxt Image ([cd9ed9b](https://github.com/kukson777/nuxt-image-viewer/commit/cd9ed9b))
- Plain cursor over the backdrop ([53a4f2c](https://github.com/kukson777/nuxt-image-viewer/commit/53a4f2c))

### 📖 Documentation

- Deploy the documentation site to GitHub Pages ([5adea47](https://github.com/kukson777/nuxt-image-viewer/commit/5adea47))
- Link the documentation site ([bc42963](https://github.com/kukson777/nuxt-image-viewer/commit/bc42963))
- Custom buttons and arrows, ImageViewerGroup, idle controls ([91b8d1c](https://github.com/kukson777/nuxt-image-viewer/commit/91b8d1c))
- Live examples in the recipes ([dfa1793](https://github.com/kukson777/nuxt-image-viewer/commit/dfa1793))

### 📦 Build

- Prepare the module before building the docs ([3f4a44d](https://github.com/kukson777/nuxt-image-viewer/commit/3f4a44d))

### ❤️ Contributors

- Ernest Manukyan

## v1.0.0

The first release: a full-screen image viewer for Nuxt that opens from the image on the page.

- `<ZoomImage>` and `data-image-viewer` attributes for plain images, groups with `data-image-viewer-group`
- `useImageViewer()` to open the viewer from code
- Endless strip, swipe, keys and arrows; zoom with a click, double tap, wheel or pinch; drag to close
- Options in `nuxt.config` and per call, CSS variables, BEM classes in a cascade layer
- No dependencies besides Nuxt
