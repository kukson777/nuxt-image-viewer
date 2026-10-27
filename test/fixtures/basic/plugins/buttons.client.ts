import { h } from 'vue'
import { useImageViewer } from '../../../../src/runtime/composables/useImageViewer'
import { defineNuxtPlugin } from '#imports'

// An arrow of your own needs no props: the viewer places it and scrolls on its click
const OwnArrow = () => h('button', { 'type': 'button', 'data-own-arrow': '' }, h('svg'))

// Custom buttons for every viewer, including the ones opened by a click on an image:
// one with a text, one with an icon component; and an own next arrow
export default defineNuxtPlugin(() => {
  useImageViewer().configure({
    controls: { next: OwnArrow },
    buttons: [
      {
        name: 'mark',
        text: 'Mark',
        onClick: ({ item, close }) => {
          document.body.dataset.marked = item.src
          close()
        },
      },
      {
        name: 'star',
        label: 'Star',
        icon: () => h('svg', { 'viewBox': '0 0 24 24', 'data-star-icon': '' }),
        onClick: () => {},
      },
    ],
  })
})
