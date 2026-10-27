import type { ImageViewerOpenOptions } from './types'

// Options of <ImageViewerGroup> by its element: the plugin reads them when an image in
// the group is clicked. Filled on mount only, so the server never holds any
export const groupOptions = new WeakMap<Element, ImageViewerOpenOptions>()
