// GitHub Pages serves the site from a subfolder: NUXT_APP_BASE_URL=/nuxt-image-viewer/,
// and NUXT_SITE_URL is the bare origin — nuxt-site-config adds the base itself
const base = process.env.NUXT_APP_BASE_URL ?? '/'
const subfolder = base !== '/'
const siteUrl = process.env.NUXT_SITE_URL || 'http://localhost:3000'

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

// Docus and its modules don't fully support a subfolder: og:url, the canonical link and
// llms.txt are built from the bare origin, Nuxt Content puts the base inside /raw/, and
// the markdown twins of pages exist only under /raw/ on a static host. Fixed in the
// generated files
function fixSubfolderUrls(text: string) {
  const origin = new URL(siteUrl).origin
  const path = base.replace(/\/$/, '')
  return text
    .replaceAll(`${origin}/raw${path}.md`, `${origin}/raw/index.md`)
    .replaceAll(`${origin}/raw${path}/`, `${origin}/raw/`)
    .replace(new RegExp(`(type="text/markdown" href="${escape(origin)})(?!/raw/)(/[^"]*")`, 'g'), '$1/raw$2')
    .replace(new RegExp(`${escape(origin)}(?!${escape(path)}(?:[/"'?#)\\s]|$))`, 'gm'), origin + path)
}

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['nuxt-image-viewer'],
  site: {
    name: 'Nuxt Image Viewer',
    // The public address — llms.txt, the sitemap and OG images need it
    url: siteUrl,
  },
  compatibilityDate: '2025-07-18',
  imageViewer: {
    // Above the sticky header of the site
    zIndex: 100,
    // The chat bubble of the Recipes example, hidden like a real chat widget
    hide: ['.demo-chat-bubble'],
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
      'Options for one gallery: wrap it in `<ImageViewerGroup :options="{...}">` — anything `open()` takes, including custom `buttons` and `controls` (own prev / next arrows). For every viewer: `useImageViewer().configure({...})` in a client plugin.',
      'Reading this documentation as an agent: /llms-full.txt contains every page in one file; any page is also available as Markdown under /raw/<path>.md, and the MCP server is at /mcp.',
    ],
  },
  mcp: {
    name: 'Nuxt Image Viewer documentation',
  },
  // robots.txt and /.well-known only work at the root of a domain — in a subfolder they
  // are never read, and both modules refuse to build there: no robots.txt, and agent
  // discovery gets the bare origin it insists on
  ...(subfolder && {
    robots: { robotsTxt: false },
    agentDiscovery: { siteUrl: new URL(siteUrl).origin },
    nitro: {
      hooks: {
        'prerender:generate'(route) {
          if (route.contents && /html|xml|text\/|markdown/.test(route.contentType ?? ''))
            route.contents = fixSubfolderUrls(route.contents)
        },
      },
    },
  }),
})
