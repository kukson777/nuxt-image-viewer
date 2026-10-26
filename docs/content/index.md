---
seo:
  title: Images that open where they live
  description: Full-screen image viewer for Nuxt. Expands from the image on the page, swipes through an endless strip, zooms with a pinch, wheel or double tap, closes with a drag. No dependencies besides Nuxt.
  ogImage: /og.png
---

::u-page-hero{orientation="horizontal"}
#top
  :::hero-background
  :::

#headline
  :::u-button{size="sm" variant="subtle" color="primary" class="rounded-full px-3 py-1 text-sm font-semibold" to="/docs/getting-started/introduction" trailing-icon="i-lucide-arrow-right"}
  Nuxt 3 & 4 · no dependencies
  :::

#title
Images that open [where they live]{.text-primary}.

#description
A full-screen viewer for Nuxt. The image expands from its place on the page, swipes through an endless strip, zooms with a pinch, wheel or double tap — and flies back home when you drag it away.

#links
  :::u-button{size="xl" to="/docs/getting-started/installation" trailing-icon="i-lucide-arrow-right"}
  Get started
  :::

  :::install-command
  :::

#default
  :::hero-gallery
  :::
::

::u-page-section
#title
Feels like a native photo app

#description
Springs, inertia and finely tuned gesture thresholds make every swipe, pinch and throw feel right. Open the gallery above on your phone.

#default
  :::feature-grid
  :::
::

::u-page-section
#title
Three ways to open an image

#description
Mark images in the template, tag any `<img>` you already have, or open a list from code.

#default
  :::u-page-grid{class="lg:grid-cols-3"}
    ::::u-page-card{spotlight to="/docs/guide/zoom-image"}
    #title
    The component

    #description
    `<ZoomImage>` renders an image the viewer opens on click, Enter or Space — `<NuxtImg>` when Nuxt Image is installed.

    #footer
    ```vue
    <ZoomImage
      src="/photos/dawn.jpg"
      :width="2400"
      :height="1600"
      caption="Dawn"
    />
    ```
    ::::

    ::::u-page-card{spotlight to="/docs/guide/plain-images"}
    #title
    Data attributes

    #description
    No component needed: tag the images you already render, from a CMS or Markdown, and group them by a container.

    #footer
    ```html
    <article data-image-viewer-group>
      <img
        src="/photos/dawn.jpg"
        data-image-viewer
      >
    </article>
    ```
    ::::

    ::::u-page-card{spotlight to="/docs/guide/open-from-code"}
    #title
    From code

    #description
    `useImageViewer()` opens any list — with page thumbnails to fly from, or without them, with a fade.

    #footer
    ```ts
    const viewer = useImageViewer()

    viewer.open(photos, 2, {
      loop: false,
    })
    ```
    ::::
  :::
::

::u-page-section
#title
Make it yours

#description
Pick colours and shapes, switch controls and behaviour, then preview the result and copy the code.

#default
  :::theme-builder
  :::
::

::u-page-section
  :::cta-banner
  :::
::
