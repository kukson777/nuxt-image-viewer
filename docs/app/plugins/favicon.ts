// Docus links the favicon from app config as is, without app.baseURL — on GitHub Pages
// (a subfolder) it would 404
export default defineNuxtPlugin(() => {
  updateAppConfig({ header: { logo: { favicon: `${useRuntimeConfig().app.baseURL}favicon.svg` } } })
})
