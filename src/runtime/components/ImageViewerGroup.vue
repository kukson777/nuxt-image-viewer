<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import type { FunctionalComponent, VNode } from 'vue'
import { groupOptions } from '../groups'
import type { ImageViewerOpenOptions } from '../types'

// A group of images with options of its own: the viewer opened by a click on an image
// inside scrolls through this group and takes these options on top of the global ones —
// buttons, arrows, loop, anything open() takes. The #prev and #next slots are arrows of
// your own, written right in the template: the viewer places them and scrolls on a click
const props = withDefaults(defineProps<{
  /** Options for the viewers of this group, as for `open()`. */
  options?: ImageViewerOpenOptions
  /** Tag of the group element. */
  as?: string
}>(), {
  options: () => ({}),
  as: 'div',
})

const slots = defineSlots<{
  default?: () => VNode[]
  /** Your own prev arrow, e.g. a `<UButton>`. */
  prev?: () => VNode[]
  /** Your own next arrow, e.g. a `<UButton>`. */
  next?: () => VNode[]
}>()

// A slot as the arrow component the viewer renders
function arrow(name: 'prev' | 'next'): FunctionalComponent {
  return () => slots[name]?.()
}

const options = computed<ImageViewerOpenOptions>(() => ({
  ...props.options,
  controls: {
    ...props.options.controls,
    ...(slots.prev && { prev: arrow('prev') }),
    ...(slots.next && { next: arrow('next') }),
  },
}))

const root = useTemplateRef<HTMLElement>('root')

onMounted(() => {
  watch(options, (value) => {
    if (root.value)
      groupOptions.set(root.value, value)
  }, { immediate: true })
})

onBeforeUnmount(() => {
  if (root.value)
    groupOptions.delete(root.value)
})
</script>

<template>
  <component
    :is="as"
    ref="root"
    data-image-viewer-group
  >
    <slot />
  </component>
</template>
