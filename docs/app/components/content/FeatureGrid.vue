<script setup lang="ts">
// Feature grid of the landing, like nuxt.com: items rise 10px into place and fade in
// over 250 ms, 100 ms apart, when the grid scrolls into view; the last cell invites
// into the docs. Timings are measured from nuxt.com.
// The server renders everything visible; only a grid still below the fold on mount is
// hidden to be revealed, so nothing flashes and nothing is lost without JavaScript
const features = [
  { icon: 'i-lucide-expand', title: 'Opens from the page', description: 'The image grows out of its thumbnail — crop and rounded corners included — and flies back into it on close.' },
  { icon: 'i-lucide-infinity', title: 'Endless strip', description: 'Every slide is in the DOM and shows the copy already loaded on the page, so there is no blank frame at any swiping pace.' },
  { icon: 'i-lucide-zoom-in', title: 'Zoom every way', description: 'Click, double tap, wheel and pinch — the point under the cursor or fingers stays in place. A zoomed image pans with inertia.' },
  { icon: 'i-lucide-move-vertical', title: 'Drag to close', description: 'Pull the image up or down and the backdrop fades as you go. A short pull springs back, a throw closes.' },
  { icon: 'i-lucide-feather', title: 'No dependencies', description: 'Plain Vue, plain CSS and inline SVG. No lightbox library, no VueUse, no UI kit — the viewer loads on the first open.' },
  { icon: 'i-lucide-palette', title: 'Yours to style', description: 'Options in nuxt.config and per call, CSS variables, BEM classes in a cascade layer — or turn the styles off.' },
  { icon: 'i-lucide-accessibility', title: 'Accessible', description: 'A real dialog with keyboard control, a focus trap, focus return and reduced motion support.' },
  { icon: 'i-lucide-bot', title: 'Agent-ready', description: 'A typed API with JSDoc everywhere, plus llms.txt and an MCP server for these docs.' },
]

const grid = useTemplateRef('grid')
const state = ref<'shown' | 'hidden' | 'revealed'>('shown')

onMounted(() => {
  const el = grid.value
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || el.getBoundingClientRect().top < window.innerHeight)
    return
  state.value = 'hidden'
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting)
      return
    state.value = 'revealed'
    observer.disconnect()
  }, { threshold: 0.15 })
  observer.observe(el)
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <ul
    ref="grid"
    class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10"
  >
    <li
      v-for="(feature, i) in [...features, null]"
      :key="feature?.title ?? 'docs'"
      class="transition duration-250 ease-out"
      :class="[state === 'hidden' ? 'translate-y-2.5 opacity-0' : '', feature ? '' : 'flex h-full flex-col justify-center gap-4 bg-muted/50 p-4']"
      :style="{ transitionDelay: state === 'revealed' ? `${i * 100}ms` : '0ms' }"
    >
      <UPageFeature
        v-if="feature"
        orientation="vertical"
        :icon="feature.icon"
        :title="feature.title"
        :description="feature.description"
      />

      <template v-else>
        <span class="text-lg font-semibold text-highlighted">Dive into the docs now</span>

        <div>
          <UButton
            to="/docs/getting-started/introduction"
            trailing-icon="i-lucide-arrow-right"
          >
            Start reading docs
          </UButton>
        </div>
      </template>
    </li>
  </ul>
</template>
