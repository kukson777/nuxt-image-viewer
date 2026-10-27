import type { Component, Ref } from 'vue'

/** Accessible names of the dialog and its controls. */
export interface ImageViewerLabels {
  dialog: string
  close: string
  zoomIn: string
  zoomOut: string
  fullscreen: string
  exitFullscreen: string
  prev: string
  next: string
}

/** Which controls the viewer shows. */
export interface ImageViewerUi {
  /** `2 / 5` in the top left corner. */
  counter: boolean
  zoom: boolean
  /** Shown only where the Fullscreen API is available. */
  fullscreen: boolean
  close: boolean
  /** Prev / next buttons. Hidden on touch screens anyway — swipe there. */
  arrows: boolean
  caption: boolean
}

/** Viewer behaviour. Set globally in `nuxt.config` (`imageViewer: {...}`) or per call in `open()`. */
export interface ImageViewerBehavior {
  /**
   * z-index of the viewer layer. Raise it above your own fixed bars and widgets.
   * @default 1000
   */
  zIndex: number
  /**
   * Opacity of the backdrop, 0–1. `1` hides the page completely.
   * The colour is the `--image-viewer-bg` CSS variable.
   * @default 0.8
   */
  bgOpacity: number
  /**
   * Endless strip: the first image follows the last one. Needs at least 3 images.
   * @default true
   */
  loop: boolean
  /**
   * Gap between slides as a share of the viewport width.
   * @default 0.1
   */
  spacing: number
  /**
   * Upper zoom limit, relative to the image fitted into the screen. Images are zoomed
   * up to their natural size but at least 2×, and never above this value.
   * @default 4
   */
  maxZoom: number
  /**
   * Close by dragging the image up or down.
   * @default true
   */
  closeOnVerticalDrag: boolean
  /**
   * Close by a click or a tap outside the image.
   * @default true
   */
  closeOnBackdropClick: boolean
  /**
   * Fade the controls out after the mouse rests for this long, ms — the image is left
   * alone. Any mouse move or key brings them back. `0` keeps them shown. Only on
   * devices with a mouse: touch screens keep the controls.
   * @default 4000
   */
  idleDelay: number
  /**
   * Fade the caption out together with the controls. `false` leaves the image with its
   * caption.
   * @default true
   */
  idleHidesCaption: boolean
  /** Which controls to show. */
  ui: ImageViewerUi
  /** Accessible names of the dialog and its buttons. */
  labels: ImageViewerLabels
}

/** Options available at runtime (`useRuntimeConfig().public.imageViewer`). */
export interface ImageViewerConfig extends ImageViewerBehavior {
  /**
   * Class added to `<html>` while the viewer is open.
   * @default 'image-viewer-open'
   */
  openClass: string
  /**
   * CSS selectors hidden while the viewer is open — chat widgets and other things
   * that sit above every layer.
   * @default []
   * @example ['jdiv', '#intercom-container']
   */
  hide: string[]
  /**
   * Open the viewer on click, Enter and Space on any `img[data-image-viewer]` of the page.
   * Turn off to open it only from code with `useImageViewer().open()`.
   * @default true
   */
  autoOpen: boolean
}

interface ImageViewerButtonBase {
  /** Unique name. Also the class modifier: `.image-viewer__button--{name}`. */
  name: string
  onClick: (context: { item: ImageViewerSlide, index: number, close: () => void }) => void
}

/**
 * Icon of a custom button: an icon name drawn by Nuxt Icon (included in Nuxt UI), as in
 * `<UIcon name>`, or any component.
 * @example 'i-lucide-download'
 */
export type ImageViewerButtonIcon = string | Component

/**
 * A button of your own in the toolbar, before the built-in ones: an icon, a text, or
 * both. An icon-only button needs a `label` — its accessible name.
 *
 * @example
 * const download: ImageViewerButton = {
 *   name: 'download',
 *   label: 'Download',
 *   icon: 'i-lucide-download',
 *   onClick: ({ item }) => window.open(item.src),
 * }
 *
 * const share: ImageViewerButton = {
 *   name: 'share',
 *   text: 'Share',
 *   onClick: ({ item }) => navigator.share?.({ url: item.src }),
 * }
 */
export type ImageViewerButton = ImageViewerButtonBase & (
  | {
    icon: ImageViewerButtonIcon
    /** Text shown next to the icon. */
    text?: string
    /** Accessible name — required without `text`. */
    label: string
  }
  | {
    icon?: ImageViewerButtonIcon
    /** Text on the button; also its accessible name unless `label` is set. */
    text: string
    label?: string
  }
)

/**
 * Your own components in place of the built-in prev / next arrows — a `UButton`, your
 * own SFC or a render function. They need no props: the viewer puts them in the
 * arrow's place, scrolls on their click, hides them at the ends of a strip, on touch
 * screens and when the mouse rests, and gives an icon-only button the label.
 *
 * @example
 * useImageViewer().configure({
 *   controls: {
 *     prev: () => h(UButton, { icon: 'i-lucide-arrow-left' }),
 *     next: () => h(UButton, { icon: 'i-lucide-arrow-right' }),
 *   },
 * })
 */
export interface ImageViewerControls {
  prev: Component
  next: Component
}

/**
 * Per-call overrides of the global options. Also takes custom `buttons` — they hold
 * functions, so they can't live in `nuxt.config`.
 */
export type ImageViewerOpenOptions = Partial<Omit<ImageViewerBehavior, 'ui' | 'labels'>> & {
  ui?: Partial<ImageViewerUi>
  labels?: Partial<ImageViewerLabels>
  /** Your own components in place of built-in controls. */
  controls?: Partial<ImageViewerControls>
  /** Buttons of your own. Replace the ones set with `configure()`. */
  buttons?: ImageViewerButton[]
}

/** One image of the viewer. Only `src` is required. */
export interface ImageViewerItem {
  /** Full-size image shown in the viewer. */
  src: string
  /**
   * Smaller copy already loaded on the page — shown at once while `src` loads.
   * Defaults to the `currentSrc` of `element`, otherwise to `src`.
   */
  thumb?: string
  /**
   * Natural size of `src`. The viewer needs it to fit and zoom the image; without it
   * the image is loaded first to measure it, so the viewer opens a bit later.
   */
  width?: number
  height?: number
  alt?: string
  /** Text shown under the image. */
  caption?: string
  /**
   * Element on the page the image opens from and closes back into. Without it the
   * viewer fades in and out.
   */
  element?: HTMLElement
}

/** Item with everything the viewer needs resolved. */
export interface ImageViewerSlide extends Required<Omit<ImageViewerItem, 'caption' | 'element'>> {
  caption?: string
  element?: HTMLElement
}

/** Returned by `useImageViewer()`. */
export interface ImageViewerApi {
  /** `true` from `open()` until the closing animation starts. */
  isOpen: Readonly<Ref<boolean>>
  /** Index of the current image. */
  index: Readonly<Ref<number>>
  /** Images of the open viewer. */
  items: Readonly<Ref<readonly ImageViewerSlide[]>>
  /**
   * Open the viewer. Ignored while it is already open.
   * @param items images, or a single image
   * @param index image to start from
   * @param options overrides of the global options for this viewer only
   */
  open: (items: ImageViewerItem | ImageViewerItem[], index?: number, options?: ImageViewerOpenOptions) => Promise<void>
  /**
   * Set options for every viewer from now on, on top of `nuxt.config` — including the
   * ones opened by a click on an image. The place for custom `buttons`, which can't be
   * in `nuxt.config`. Call it in a client plugin.
   * @example useImageViewer().configure({ buttons: [downloadButton] })
   */
  configure: (options: ImageViewerOpenOptions) => void
  /** Close with the animation back into the page. */
  close: () => void
  next: () => void
  prev: () => void
  /** Scroll to an image by its index. */
  goTo: (index: number) => void
}
