export default defineNuxtConfig({
  modules: ['nuxt-image-viewer'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  imageViewer: {
    // Above the sticky header of the demo page
    zIndex: 100,
    // Hidden while the viewer is open, like a chat widget would be
    hide: ['.chat-bubble'],
  },
})
