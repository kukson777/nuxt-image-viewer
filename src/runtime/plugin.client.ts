// Images with data-image-viewer (the ZoomImage component) open full screen on click,
// Enter and Space — on any page, without handlers in place. The viewer scrolls through
// the images of the closest [data-image-viewer-group], without one — of the whole page.
//
// The module can't edit the user's app.vue, so on the first open the viewer component
// is imported and rendered into a container in <body> with the app context; after it
// closes it is unmounted. State is client-only and kept here, not in useState: it holds
// live DOM nodes the viewer opens from and closes back into.
import { computed, h, render, shallowReactive } from 'vue'
import { defu } from 'defu'
import type { ImageViewerApi, ImageViewerBehavior, ImageViewerItem, ImageViewerOpenOptions, ImageViewerSlide } from './types'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

type ViewerExposed = Pick<ImageViewerApi, 'close' | 'next' | 'prev' | 'goTo'>

// The type of a provide isn't inferred for this plugin by nuxt typecheck — declared
// explicitly. There is no plugin on the server, so it may be undefined
declare module '#app' {
  interface NuxtApp {
    $imageViewer: ImageViewerApi | undefined
  }
}

const SELECTOR = 'img[data-image-viewer]'

// Natural size of an image the caller didn't give one for
async function measure(item: ImageViewerSlide) {
  if (item.width && item.height)
    return
  const img = new Image()
  img.src = item.src
  await img.decode().catch(() => {})
  item.width = img.naturalWidth || window.innerWidth
  item.height = img.naturalHeight || window.innerHeight
}

function toSlide(item: ImageViewerItem): ImageViewerSlide {
  const pageSrc = item.element instanceof HTMLImageElement ? item.element.currentSrc || item.element.src : ''
  return {
    src: item.src,
    thumb: item.thumb || pageSrc || item.src,
    width: item.width || 0,
    height: item.height || 0,
    alt: item.alt ?? (item.element instanceof HTMLImageElement ? item.element.alt : ''),
    caption: item.caption,
    element: item.element,
  }
}

function fromImage(img: HTMLImageElement): ImageViewerItem {
  return {
    // The page copy is often a smaller one: the full image is in data-image-viewer-src
    src: img.dataset.imageViewerSrc || img.currentSrc || img.src,
    width: Number(img.dataset.imageViewerWidth) || img.naturalWidth,
    height: Number(img.dataset.imageViewerHeight) || img.naturalHeight,
    caption: img.dataset.imageViewerCaption,
    element: img,
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.imageViewer
  const state = shallowReactive({
    open: false,
    index: 0,
    items: [] as ImageViewerSlide[],
  })
  let container: HTMLElement | null = null
  let instance: ViewerExposed | null = null

  function unmount() {
    if (!container)
      return
    render(null, container)
    container.remove()
    container = null
    instance = null
  }

  async function open(items: ImageViewerItem | ImageViewerItem[], index = 0, overrides: ImageViewerOpenOptions = {}) {
    if (container)
      return
    const slides = (Array.isArray(items) ? items : [items]).map(toSlide)
    if (!slides.length)
      return
    container = document.createElement('div')
    document.body.append(container)

    const [{ default: ImageViewer }] = await Promise.all([
      import('./components/ImageViewer.vue'),
      Promise.all(slides.map(measure)),
    ])
    const options = defu(overrides, config) as ImageViewerBehavior & { openClass: string }
    state.items = slides
    state.index = Math.min(Math.max(index, 0), slides.length - 1)
    state.open = true

    const vnode = h(ImageViewer, {
      items: slides,
      index: state.index,
      options,
      onChange: (i: number) => state.index = i,
      onClose: () => state.open = false,
      onClosed: unmount,
    })
    vnode.appContext = nuxtApp.vueApp._context
    render(vnode, container)
    instance = (vnode.component?.exposed ?? null) as ViewerExposed | null
  }

  if (config.hide.length) {
    const style = document.createElement('style')
    style.textContent = `.${config.openClass} :is(${config.hide.join(', ')}) { display: none !important; }`
    document.head.append(style)
  }

  if (config.autoOpen) {
    const onTrigger = (event: MouseEvent | KeyboardEvent) => {
      if (container || (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' '))
        return
      const target = (event.target as Element | null)?.closest<HTMLImageElement>(SELECTOR)
      if (!target)
        return
      event.preventDefault()
      const root = target.closest<HTMLElement>('[data-image-viewer-group]') ?? document.body
      const images = [...root.querySelectorAll<HTMLImageElement>(SELECTOR)]
      void open(images.map(fromImage), images.indexOf(target))
    }
    document.addEventListener('click', onTrigger)
    document.addEventListener('keydown', onTrigger)
  }

  const api: ImageViewerApi = {
    isOpen: computed(() => state.open),
    index: computed(() => state.index),
    items: computed(() => state.items),
    open,
    close: () => instance?.close(),
    next: () => instance?.next(),
    prev: () => instance?.prev(),
    goTo: index => instance?.goTo(index),
  }

  return { provide: { imageViewer: api } }
})
