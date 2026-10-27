// Type checks for custom buttons, run by `npm run test:types`: every button needs an
// accessible name — its text, or a label when it shows only an icon
import { h } from 'vue'
import type { ImageViewerButton } from '../src/runtime/types'

const icon = () => h('svg')
const onClick = () => {}

export const buttons: ImageViewerButton[] = [
  { name: 'icon', label: 'Icon', icon, onClick },
  { name: 'text', text: 'Text', onClick },
  { name: 'both', text: 'Both', icon, onClick },
  // @ts-expect-error an icon-only button without a label has no accessible name
  { name: 'nameless', icon, onClick },
  // @ts-expect-error neither an icon nor a text
  { name: 'empty', label: 'Empty', onClick },
]
