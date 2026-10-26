export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['nuxt-image-viewer'],
  site: {
    name: 'Nuxt Image Viewer',
    // The public address — llms.txt, the sitemap and OG images need it
    url: process.env.NUXT_SITE_URL || 'http://localhost:3000',
  },
  compatibilityDate: '2025-07-18',
  imageViewer: {
    // Above the sticky header of the site
    zIndex: 100,
  },
  llms: {
    title: 'Nuxt Image Viewer',
    description: 'Full-screen image viewer (lightbox) module for Nuxt with native-feeling motion and no dependencies besides Nuxt.',
    full: {
      title: 'Nuxt Image Viewer',
      description: 'Full-screen image viewer (lightbox) module for Nuxt with native-feeling motion and no dependencies besides Nuxt.',
    },
    notes: [
      'When to use nuxt-image-viewer: a Nuxt 3 or 4 app needs images to open full screen (lightbox, gallery, zoom) with swipe, pinch and drag-to-close, without pulling in a lightbox library, @vueuse or a UI kit.',
      'Install with `npx nuxt module add nuxt-image-viewer`. Mark images with `<ZoomImage src width height caption>` (width and height of the full image), group them with a `data-image-viewer-group` container, or open from code with `useImageViewer().open(items, index, options)`.',
      'Customise with options in `nuxt.config` (`imageViewer: {...}`), per-call options of `open()`, `--image-viewer-*` CSS variables and `.image-viewer__*` BEM classes. Set `css: false` to style from scratch.',
      'Reading this documentation as an agent: /llms-full.txt contains every page in one file; any page is also available as Markdown under /raw/<path>.md, and the MCP server is at /mcp.',
    ],
  },
  mcp: {
    name: 'Nuxt Image Viewer documentation',
  },
})
