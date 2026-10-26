import { computed } from 'vue'
import type { ImageViewerApi } from '../types'
import { useNuxtApp } from '#imports'

const noop = () => {}

/**
 * Control the image viewer from code.
 *
 * @example
 * const viewer = useImageViewer()
 * viewer.open([{ src: '/a.jpg', width: 1600, height: 900, caption: 'A' }], 0, { loop: false })
 */
export function useImageViewer(): ImageViewerApi {
  // The plugin is client-only: on the server nothing opens
  return useNuxtApp().$imageViewer ?? {
    isOpen: computed(() => false),
    index: computed(() => 0),
    items: computed(() => []),
    open: async () => {},
    close: noop,
    next: noop,
    prev: noop,
    goTo: noop,
  }
}
