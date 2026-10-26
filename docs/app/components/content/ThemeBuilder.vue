<script setup lang="ts">
import type { ImageViewerOpenOptions, ImageViewerUi } from 'nuxt-image-viewer'

// Live theme builder: CSS variables and options of the viewer, a preview that opens with
// them, and the code to copy. The variables go on <html> only while its viewer is open
interface Theme {
  bg: string
  bgOpacity: number
  color: string
  button: string
  buttonAlpha: number
  buttonSize: number
  buttonRadius: number
  caption: string
  captionAlpha: number
}

const presets: Record<string, Theme> = {
  Default: { bg: '#000000', bgOpacity: 0.8, color: '#FFFFFF', button: '#FFFFFF', buttonAlpha: 0.12, buttonSize: 44, buttonRadius: 22, caption: '#000000', captionAlpha: 0.6 },
  Light: { bg: '#FFFFFF', bgOpacity: 0.95, color: '#18181B', button: '#18181B', buttonAlpha: 0.06, buttonSize: 44, buttonRadius: 22, caption: '#FFFFFF', captionAlpha: 0.9 },
  Violet: { bg: '#1E1B4B', bgOpacity: 0.92, color: '#FFFFFF', button: '#8B5CF6', buttonAlpha: 1, buttonSize: 48, buttonRadius: 12, caption: '#8B5CF6', captionAlpha: 1 },
  Square: { bg: '#0A0A0A', bgOpacity: 1, color: '#FAFAFA', button: '#FAFAFA', buttonAlpha: 0, buttonSize: 40, buttonRadius: 0, caption: '#0A0A0A', captionAlpha: 0 },
}

const DEFAULTS = {
  loop: true,
  spacing: 0.1,
  maxZoom: 4,
  closeOnVerticalDrag: true,
  closeOnBackdropClick: true,
}

const theme = reactive<Theme>({ ...presets.Default! })
const preset = ref('Default')
const behavior = reactive({ ...DEFAULTS })
const ui = reactive<ImageViewerUi>({ counter: true, zoom: true, fullscreen: true, close: true, arrows: true, caption: true })

function applyPreset(name: string) {
  preset.value = name
  Object.assign(theme, presets[name])
}

function rgba(hex: string, alpha: number) {
  const n = Number.parseInt(hex.slice(1, 7), 16)
  return alpha >= 1 ? hex.toLowerCase() : `rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255} / ${+alpha.toFixed(2)})`
}

// The hover backing: a bit more opaque, or mixed with the foreground when already solid
function hover(hex: string, alpha: number) {
  return alpha >= 0.85
    ? `color-mix(in srgb, ${hex.toLowerCase()} 82%, ${theme.color.toLowerCase()})`
    : rgba(hex, Math.min(1, alpha + 0.1))
}

const variables = computed(() => ({
  '--image-viewer-bg': theme.bg.toLowerCase(),
  '--image-viewer-color': theme.color.toLowerCase(),
  '--image-viewer-button-bg': rgba(theme.button, theme.buttonAlpha),
  '--image-viewer-button-bg-hover': hover(theme.button, theme.buttonAlpha),
  '--image-viewer-button-size': `${theme.buttonSize}px`,
  '--image-viewer-button-radius': `${theme.buttonRadius}px`,
  '--image-viewer-caption-bg': rgba(theme.caption, theme.captionAlpha),
  '--image-viewer-focus-color': theme.color.toLowerCase(),
}))

// Only what differs from the module defaults goes into the config
const options = computed(() => {
  const result: ImageViewerOpenOptions = {}
  if (theme.bgOpacity !== 0.8)
    result.bgOpacity = theme.bgOpacity
  for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
    if (behavior[key] !== DEFAULTS[key])
      (result as Record<string, unknown>)[key] = behavior[key]
  }
  const hidden = Object.fromEntries(Object.entries(ui).filter(([, on]) => !on))
  if (Object.keys(hidden).length)
    result.ui = hidden
  return result
})

function toTs(value: unknown, indent: string): string {
  if (typeof value !== 'object' || value === null)
    return JSON.stringify(value).replace(/"/g, '\'')
  const entries = Object.entries(value)
  return `{\n${entries.map(([k, v]) => `${indent}  ${k}: ${toTs(v, `${indent}  `)},`).join('\n')}\n${indent}}`
}

const files = computed(() => {
  const config = Object.keys(options.value).length
    ? `  imageViewer: ${toTs(options.value, '  ')},\n`
    : ''
  const css = Object.entries(variables.value).map(([k, v]) => `  ${k}: ${v};`).join('\n')
  return [
    { filename: 'nuxt.config.ts', lang: 'ts', code: `export default defineNuxtConfig({\n  modules: ['nuxt-image-viewer'],\n${config}})` },
    { filename: 'assets/css/main.css', lang: 'css', code: `:root {\n${css}\n}` },
  ]
})

// Same Shiki themes as the code blocks of the site, loaded on demand in the browser.
// Until it's ready — and on the server — the code is shown plain
type Highlight = (code: string, lang: string) => string
let highlighter: Promise<Highlight> | undefined
function loadHighlighter() {
  return highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([import('shiki/core'), import('shiki/engine/javascript')])
    const core = await createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      langs: [import('shiki/langs/typescript.mjs'), import('shiki/langs/css.mjs')],
      themes: [import('shiki/themes/material-theme-lighter.mjs'), import('shiki/themes/material-theme-palenight.mjs')],
    })
    return (code, lang) => core.codeToHtml(code, { lang, themes: { light: 'material-theme-lighter', dark: 'material-theme-palenight' } })
      .replace(/^.*?<code>|<\/code><\/pre>$/gs, '')
      // Lines are blocks in the prose styles — the newlines between them would double them
      .replaceAll('</span>\n<span class="line">', '</span><span class="line">')
  })()
}

const highlighted = ref<string[]>([])
// Highlighting runs after a change settles — not on every slider tick
let timer: ReturnType<typeof setTimeout> | undefined
watch(files, (value) => {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const highlight = await loadHighlighter()
    highlighted.value = value.map(file => highlight(file.code, file.lang))
  }, 120)
}, { immediate: import.meta.client })

const viewer = useImageViewer()
const previews = [demoImages.aurora, demoImages.duskPortrait, demoImages.bauhaus]
const thumbs = useTemplateRef<HTMLElement[]>('thumbs')

let applied = false
function setVariables(on: boolean) {
  const style = document.documentElement.style
  for (const [key, value] of Object.entries(variables.value)) {
    if (on)
      style.setProperty(key, value)
    else
      style.removeProperty(key)
  }
  applied = on
}

function open(index: number) {
  setVariables(true)
  void viewer.open(previews.map((image, i) => ({
    ...image,
    alt: image.caption,
    element: thumbs.value?.[i]?.querySelector('img') ?? undefined,
  })), index, options.value)
}

// Keep the variables through the closing animation, then give the page back its own
watch(viewer.isOpen, (open) => {
  if (!open && applied)
    setTimeout(() => !viewer.isOpen.value && setVariables(false), 450)
})

onBeforeUnmount(() => applied && setVariables(false))

const uiLabels: Record<keyof ImageViewerUi, string> = {
  counter: 'Counter',
  zoom: 'Zoom button',
  fullscreen: 'Fullscreen button',
  close: 'Close button',
  arrows: 'Arrows',
  caption: 'Caption',
}

const colorFields = [
  { key: 'bg', label: 'Backdrop' },
  { key: 'color', label: 'Icons & text' },
  { key: 'button', label: 'Buttons' },
  { key: 'caption', label: 'Caption' },
] as const
</script>

<template>
  <div class="not-prose my-6 overflow-hidden rounded-xl border border-default bg-default">
    <div class="flex flex-wrap items-center gap-2 border-b border-default px-4 py-3">
      <span class="mr-1 text-sm font-medium text-highlighted">Preset</span>

      <UButton
        v-for="(_, name) in presets"
        :key="name"
        size="xs"
        :color="preset === name ? 'primary' : 'neutral'"
        :variant="preset === name ? 'solid' : 'outline'"
        @click="applyPreset(name)"
      >
        {{ name }}
      </UButton>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div class="flex flex-col gap-5 border-b border-default p-4 lg:border-b-0 lg:border-r">
        <div class="grid grid-cols-2 gap-3">
          <UFormField
            v-for="field in colorFields"
            :key="field.key"
            :label="field.label"
            size="xs"
          >
            <UPopover>
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                block
                class="justify-start font-mono"
              >
                <span
                  class="size-4 shrink-0 rounded ring ring-default"
                  :style="{ background: theme[field.key] }"
                />
                {{ theme[field.key] }}
              </UButton>

              <template #content>
                <UColorPicker
                  v-model="theme[field.key]"
                  class="p-2"
                  @update:model-value="preset = ''"
                />
              </template>
            </UPopover>
          </UFormField>
        </div>

        <UFormField
          :label="`Backdrop opacity · ${theme.bgOpacity.toFixed(2)}`"
          size="xs"
        >
          <USlider
            v-model="theme.bgOpacity"
            :min="0.3"
            :max="1"
            :step="0.01"
          />
        </UFormField>

        <UFormField
          :label="`Button opacity · ${theme.buttonAlpha.toFixed(2)}`"
          size="xs"
        >
          <USlider
            v-model="theme.buttonAlpha"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </UFormField>

        <UFormField
          :label="`Caption opacity · ${theme.captionAlpha.toFixed(2)}`"
          size="xs"
        >
          <USlider
            v-model="theme.captionAlpha"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField
            :label="`Button size · ${theme.buttonSize}px`"
            size="xs"
          >
            <USlider
              v-model="theme.buttonSize"
              :min="32"
              :max="60"
            />
          </UFormField>

          <UFormField
            :label="`Radius · ${theme.buttonRadius}px`"
            size="xs"
          >
            <USlider
              v-model="theme.buttonRadius"
              :min="0"
              :max="30"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <UFormField
            :label="`Max zoom · ${behavior.maxZoom}×`"
            size="xs"
          >
            <USlider
              v-model="behavior.maxZoom"
              :min="2"
              :max="8"
            />
          </UFormField>

          <UFormField
            :label="`Spacing · ${behavior.spacing.toFixed(2)}`"
            size="xs"
          >
            <USlider
              v-model="behavior.spacing"
              :min="0"
              :max="0.3"
              :step="0.01"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-x-3 gap-y-2">
          <USwitch
            v-model="behavior.loop"
            label="Endless strip"
            size="sm"
          />

          <USwitch
            v-model="behavior.closeOnVerticalDrag"
            label="Drag to close"
            size="sm"
          />

          <USwitch
            v-model="behavior.closeOnBackdropClick"
            label="Backdrop click"
            size="sm"
          />

          <USwitch
            v-for="(label, key) in uiLabels"
            :key="key"
            v-model="ui[key]"
            :label="label"
            size="sm"
          />
        </div>
      </div>

      <div class="flex min-w-0 flex-col gap-4 p-4">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm text-muted">
            Click a preview to open it with this theme.
          </p>

          <UButton
            size="sm"
            icon="i-lucide-maximize-2"
            @click="open(0)"
          >
            Preview
          </UButton>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="(image, i) in previews"
            ref="thumbs"
            :key="image.src"
            type="button"
            class="cursor-zoom-in overflow-hidden rounded-lg ring ring-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-label="`Preview: ${image.caption}`"
            @click="open(i)"
          >
            <NuxtImg
              :src="image.src"
              :width="image.width"
              :height="image.height"
              :alt="image.caption"
              sizes="240px"
              format="webp"
              class="aspect-[4/3] w-full rounded-lg object-cover transition hover:brightness-110"
            />
          </button>
        </div>

        <ProseCodeGroup class="min-w-0">
          <ProsePre
            v-for="(file, i) in files"
            :key="file.filename"
            :code="file.code"
            :language="file.lang"
            :filename="file.filename"
          >
            <code
              v-if="highlighted[i]"
              class="shiki"
              :innerHTML="highlighted[i]"
            />

            <code v-else>{{ file.code }}</code>
          </ProsePre>
        </ProseCodeGroup>
      </div>
    </div>
  </div>
</template>
