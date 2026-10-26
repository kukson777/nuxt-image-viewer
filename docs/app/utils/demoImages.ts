// Demo images of the site. Generated procedurally — no third-party photos
export interface DemoImage {
  src: string
  width: number
  height: number
  caption: string
}

export const demoImages = {
  alpineDawn: { src: '/images/alpine-dawn.webp', width: 2400, height: 1600, caption: 'Alpine dawn' },
  aurora: { src: '/images/aurora.webp', width: 2400, height: 1600, caption: 'Aurora over the ridge' },
  dunes: { src: '/images/dunes.webp', width: 2400, height: 1600, caption: 'Dunes at noon' },
  ocean: { src: '/images/ocean.webp', width: 2400, height: 1600, caption: 'Ocean sunset' },
  nightSky: { src: '/images/night-sky.webp', width: 2400, height: 1600, caption: 'A starry night' },
  duskPortrait: { src: '/images/dusk-portrait.webp', width: 1600, height: 2400, caption: 'Dusk — a portrait image' },
  valleyPanorama: { src: '/images/valley-panorama.webp', width: 3000, height: 1500, caption: 'Valley panorama' },
  bauhaus: { src: '/images/bauhaus.webp', width: 2000, height: 2000, caption: 'Bauhaus tiles — zoom in' },
  bauhausSmall: { src: '/images/bauhaus-small.webp', width: 640, height: 400, caption: 'A small image still zooms 2×' },
} satisfies Record<string, DemoImage>

export type DemoImageName = keyof typeof demoImages

// A public/ path as a URL for useImageViewer().open(): on GitHub Pages the site lives in
// a subfolder, and open() takes URLs as they are
export function publicUrl(src: string) {
  return useRuntimeConfig().app.baseURL.replace(/\/$/, '') + src
}
