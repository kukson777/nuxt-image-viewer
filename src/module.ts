import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule, hasNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { ImageViewerConfig } from './runtime/types'

export type * from './runtime/types'

export interface ModuleOptions extends ImageViewerConfig {
  /**
   * Name of the image component. `false` — don't register it and mark images with
   * the `data-image-viewer*` attributes yourself.
   * @default 'ZoomImage'
   */
  componentName: string | false
  /**
   * Render `<NuxtImg>` inside the image component. `'auto'` — when `@nuxt/image` is installed.
   * @default 'auto'
   */
  nuxtImage: boolean | 'auto'
  /**
   * Include the default styles. Turn off to style the BEM classes from scratch.
   * @default true
   */
  css: boolean
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    imageViewer: ImageViewerConfig
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-image-viewer',
    configKey: 'imageViewer',
    compatibility: { nuxt: '>=3.13.0' },
  },
  defaults: {
    zIndex: 1000,
    bgOpacity: 0.8,
    loop: true,
    spacing: 0.1,
    maxZoom: 4,
    closeOnVerticalDrag: true,
    closeOnBackdropClick: true,
    idleDelay: 4000,
    idleHidesCaption: true,
    ui: {
      counter: true,
      zoom: true,
      fullscreen: true,
      close: true,
      arrows: true,
      caption: true,
    },
    labels: {
      dialog: 'Image viewer',
      close: 'Close',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit fullscreen',
      prev: 'Previous',
      next: 'Next',
    },
    openClass: 'image-viewer-open',
    hide: [],
    autoOpen: true,
    componentName: 'ZoomImage',
    nuxtImage: 'auto',
    css: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const { componentName, nuxtImage, css, ...runtime } = options
    nuxt.options.runtimeConfig.public.imageViewer = defu(
      nuxt.options.runtimeConfig.public.imageViewer as Partial<ImageViewerConfig> | undefined,
      runtime,
    )

    if (css)
      nuxt.options.css.push(resolver.resolve('./runtime/image-viewer.css'))

    addPlugin({ src: resolver.resolve('./runtime/plugin.client'), mode: 'client' })
    addComponent({ name: 'ImageViewerGroup', filePath: resolver.resolve('./runtime/components/ImageViewerGroup.vue') })

    if (componentName) {
      const withNuxtImage = nuxtImage === 'auto' ? hasNuxtModule('@nuxt/image', nuxt) : nuxtImage
      addComponent({ name: componentName, filePath: resolver.resolve(`./runtime/components/${withNuxtImage ? 'ZoomNuxtImg' : 'ZoomImage'}.vue`) })
    }
    addImports({ name: 'useImageViewer', from: resolver.resolve('./runtime/composables/useImageViewer') })
  },
})
