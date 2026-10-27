<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, resolveDynamicComponent, useTemplateRef, watch } from 'vue'
import type { ImageViewerBehavior, ImageViewerButton, ImageViewerControls, ImageViewerSlide } from '../types'

/**
 * Full-screen image viewer. Mounted by the plugin (plugin.client.ts) for one opening
 * and unmounted after `closed` — it doesn't depend on Nuxt and gets everything in props.
 *
 * The strip is our own: every slide is in the DOM at once, so no pace of swiping shows
 * an empty frame — while the full image loads, the copy already loaded on the page is
 * visible. The image expands from its place on the page and collapses back into it.
 *
 * Motion is tuned to feel like a native photo app — the numbers below set the duration and
 * curve of opening, closing and zoom, backdrop fade, strip and return springs, friction
 * and gesture thresholds. Gestures run on pointer events, the same for mouse and finger:
 *   - drag sideways — scroll, down or up — close (the backdrop fades along);
 *   - pinch, wheel, mouse click or double tap — zoom, drag a zoomed image — pan;
 *   - click outside the image, Esc and the close button — close, arrows and ←/→ — scroll.
 */

const props = defineProps<{
  items: ImageViewerSlide[]
  /** Image to start from. */
  index: number
  options: ImageViewerBehavior & { openClass: string, buttons: ImageViewerButton[], controls: Partial<ImageViewerControls> }
}>()

const emit = defineEmits<{
  /** The current image changed. */
  change: [index: number]
  /** Closing started. */
  close: []
  /** Closing animation finished — the component can be unmounted. */
  closed: []
}>()

const EASE = 'cubic-bezier(.4, 0, .22, 1)'
const DURATION = 333
// A dragged image lags behind the finger; past the strip edge and the edge of a zoomed
// image friction is stronger
const VERTICAL_DRAG_FRICTION = 0.6
const EDGE_FRICTION = 0.35
// Closing: where the image would roll to with the throw, in thirds of the screen height
const MIN_RATIO_TO_CLOSE = 0.4
// Scrolling: a throw faster than this (px/ms) switches the slide even after a tiny drag
const MIN_NEXT_SLIDE_SPEED = 0.5
// Share of speed left after a millisecond — tells where a throw rolls to
const DECELERATION = 0.995

const { items, options } = props
const animated = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const stage = useTemplateRef('stage')
const backdrop = useTemplateRef('backdrop')
const ui = useTemplateRef('ui')

// Window size together with the scrollbar place: with scrollbar-gutter on <html> the
// gutter stays, and a layer of inset: 0 left a stripe on the right where the page showed
// through. The layer is 100vw wide, and innerWidth matches it
const W = ref(window.innerWidth)
const H = ref(window.innerHeight)
function onResize() {
  W.value = window.innerWidth
  H.value = window.innerHeight
}

const canFullscreen = document.fullscreenEnabled
const isFullscreen = ref(false)
function onFullscreenChange() {
  isFullscreen.value = !!stage.value && document.fullscreenElement === stage.value
}
function toggleFullscreen() {
  if (isFullscreen.value)
    void document.exitFullscreen()
  else
    void stage.value?.requestFullscreen().catch(() => {})
}

const index = ref(props.index)
const current = computed(() => items[index.value])
const total = items.length
const slideWidth = computed(() => W.value * (1 + options.spacing))

// Size of the image fitted into the screen. On a wide screen there is room for the arrows
// on the sides, at the top and bottom — for the toolbar and caption. Never above natural
function fit(item: ImageViewerSlide) {
  const mx = W.value < 768 || !options.ui.arrows ? 0 : 80
  const my = W.value < 768 ? 56 : 64
  const s = Math.min((W.value - mx * 2) / item.width, (H.value - my * 2) / item.height, 1)
  return { w: item.width * s, h: item.height * s, s }
}

function frameBox(item: ImageViewerSlide) {
  const { w, h } = fit(item)
  return { left: (W.value - w) / 2, top: (H.value - h) / 2, w, h }
}

// Up to the natural size, but at least 2×: a small image is worth zooming too
function zoomLimit(item: ImageViewerSlide) {
  return Math.min(Math.max(2, 1 / fit(item).s), options.maxZoom)
}

/**
 * Damped spring: no bounce at damping = 1, a slight bounce below.
 * Velocity is px/ms, as the gesture gives it. Returns a cancel function. With reduced
 * motion jumps straight to the end value
 */
function spring(from: number, to: number, velocity: number, onUpdate: (value: number) => void, { frequency = 12, damping = 1 } = {}) {
  if (!animated) {
    onUpdate(to)
    return () => {}
  }
  const damped = damping < 1 ? frequency * Math.sqrt(1 - damping * damping) : frequency
  let delta = from - to
  let speed = velocity
  let prev = performance.now()
  let raf = 0
  const frame = (now: number) => {
    const dt = (now - prev) / 1000
    prev = now
    const decay = Math.exp(-damping * frequency * dt)
    if (damping === 1) {
      const coeff = speed + frequency * delta
      delta = (delta + coeff * dt) * decay
      speed = delta * -frequency + coeff * decay
    }
    else {
      const coeff = (damping * frequency * delta + speed) / damped
      const cos = Math.cos(damped * dt)
      const sin = Math.sin(damped * dt)
      const next = decay * (delta * cos + coeff * sin)
      speed = next * -frequency * damping + decay * (-damped * delta * sin + damped * coeff * cos)
      delta = next
    }
    if (Math.abs(delta) < 1 && Math.abs(speed) < 50) {
      onUpdate(to)
      return
    }
    onUpdate(to + delta)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

// Where a throw with this velocity rolls to
function project(velocity: number) {
  return velocity * DECELERATION / (1 - DECELERATION)
}

const phase = ref<'open' | 'closing'>('open')
type Gesture = 'none' | 'swipe' | 'close' | 'pan' | 'pinch'
const gesture = ref<Gesture>('none')
const trackX = ref(0)
const closeY = ref(0)
const scale = ref(1)
const pan = reactive({ x: 0, y: 0 })
const panSprings = ref(0)
const loaded = reactive(new Set<number>())

let stopTrack = () => {}
let stopClose = () => {}
let stopPan: (() => void)[] = []

function stopMotion() {
  stopTrack()
  stopClose()
  stopPan.forEach(stop => stop())
  stopPan = []
  panSprings.value = 0
}

// The backdrop fades while the image is dragged down: at a third of the screen it's gone
const bgOpacity = computed(() => options.bgOpacity * Math.max(0, 1 - Math.abs(closeY.value) / (H.value / 3)))

const trackStyle = computed(() => ({ transform: `translate3d(${trackX.value}px, 0, 0)` }))

const closeStyle = computed(() => ({ transform: closeY.value ? `translate3d(0, ${closeY.value}px, 0)` : '' }))

const zoomStyle = computed(() => ({
  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale.value})`,
  transition: gesture.value === 'pan' || gesture.value === 'pinch' || panSprings.value || !animated ? 'none' : `transform ${DURATION}ms ${EASE}`,
}))

const zoomed = computed(() => scale.value > 1.01)

// How far a zoomed image can move before its edge leaves the screen edge
function panBounds(s = scale.value) {
  const item = current.value
  if (!item)
    return { x: 0, y: 0 }
  const { w, h } = fit(item)
  return { x: Math.max(0, (w * s - W.value) / 2), y: Math.max(0, (h * s - H.value) / 2) }
}

function clampPan() {
  const b = panBounds()
  pan.x = Math.min(b.x, Math.max(-b.x, pan.x))
  pan.y = Math.min(b.y, Math.max(-b.y, pan.y))
}

// Zoom to a point: the point under the cursor or fingers stays in place
function zoomTo(next: number, point = { x: W.value / 2, y: H.value / 2 }) {
  const item = current.value
  if (!item)
    return
  const target = Math.min(Math.max(next, 1), zoomLimit(item))
  const px = point.x - W.value / 2
  const py = point.y - H.value / 2
  pan.x = px - (px - pan.x) * (target / scale.value)
  pan.y = py - (py - pan.y) * (target / scale.value)
  scale.value = target
  if (target === 1) {
    pan.x = 0
    pan.y = 0
  }
  clampPan()
}

function toggleZoom(point?: { x: number, y: number }) {
  const item = current.value
  if (item)
    zoomTo(zoomed.value ? 1 : zoomLimit(item), point)
}

/**
 * The strip is endless — from three images: with two the neighbour on
 * the right and on the left would be the same slide. The strip position (pos) grows
 * without limit, and every slide stands in the copy closest to it: the first right after
 * the last. A slide is always moved off screen — two places and further from the current
 */
const loop = options.loop && total >= 3
const pos = ref(index.value)

function slot(i: number) {
  return loop ? i + total * Math.round((pos.value - i) / total) : i
}

function near(i: number) {
  return Math.abs(slot(i) - pos.value) <= 1
}

// The strip settles on the slide with a stiff spring — at the throw velocity
function settleTrack(velocity = 0) {
  stopTrack()
  stopTrack = spring(trackX.value, -pos.value * slideWidth.value, velocity, x => trackX.value = x, { frequency: 30 })
}

function step(delta: number, velocity = 0) {
  const target = loop ? pos.value + delta : Math.min(Math.max(pos.value + delta, 0), total - 1)
  if (target !== pos.value) {
    scale.value = 1
    pan.x = 0
    pan.y = 0
    pos.value = target
    index.value = ((target % total) + total) % total
  }
  settleTrack(velocity)
}

// Shortest way to an image: in the endless strip it may lie behind the start
function goTo(i: number) {
  if (phase.value !== 'open' || !items[i])
    return
  let delta = i - index.value
  if (loop && Math.abs(delta) > total / 2)
    delta -= Math.sign(delta) * total
  step(delta)
}

// While the image is open its place on the page stays empty — so it flies out of it
// and back into it, without a double
watch(index, (next, prev) => {
  const prevItem = items[prev]
  const nextItem = items[next]
  if (prevItem?.element)
    prevItem.element.style.visibility = ''
  if (nextItem?.element)
    nextItem.element.style.visibility = 'hidden'
  emit('change', next)
})

// The window was resized — the strip stands exactly on the current slide
watch(slideWidth, () => {
  stopTrack()
  trackX.value = -pos.value * slideWidth.value
})

function frameEl() {
  return stage.value?.querySelector<HTMLElement>(`[data-frame="${index.value}"]`) ?? null
}

// Transform that puts a frame (its layout place is box) onto the rectangle rect
function flip(rect: { left: number, top: number, width: number, height: number }, box: ReturnType<typeof frameBox>) {
  return `translate(${rect.left - box.left}px, ${rect.top - box.top}px) scale(${rect.width / box.w}, ${rect.height / box.h})`
}

function onScreen(rect: DOMRect) {
  return rect.width > 0 && rect.bottom > 0 && rect.top < H.value && rect.right > 0 && rect.left < W.value
}

/**
 * Where the image lies on the page and the clip that shows only its visible part.
 * With object-fit: cover or contain the picture doesn't match its element: the frame
 * flies to the picture itself, and the clip cuts it to the element box — otherwise the
 * image was squeezed into a cropped thumbnail and jumped when the thumbnail came back.
 * Rounding is in the clip too, not in overflow: the clip lives only in the animation,
 * and a zoomed image freely leaves the frame later. Clip values are divided by the
 * scale — the frame is stretched along with it
 */
function pageShape(item: ImageViewerSlide, box: ReturnType<typeof frameBox>) {
  const el = item.element
  const r = el?.getBoundingClientRect()
  if (!el || !r?.width || !r.height)
    return null
  const style = getComputedStyle(el)
  const fit = style.objectFit
  const s = fit === 'cover'
    ? Math.max(r.width / item.width, r.height / item.height)
    : fit === 'contain' || fit === 'scale-down'
      ? Math.min(r.width / item.width, r.height / item.height)
      : 0
  const w = s ? item.width * s : r.width
  const h = s ? item.height * s : r.height
  const [px = 0.5, py = 0.5] = style.objectPosition.split(' ').map(v => v.endsWith('%') ? Number.parseFloat(v) / 100 : 0.5)
  const rect = { left: r.left + (r.width - w) * px, top: r.top + (r.height - h) * py, width: w, height: h }
  const k = box.w / w
  const top = Math.max(0, r.top - rect.top) * k
  const right = Math.max(0, rect.left + w - r.right) * k
  const bottom = Math.max(0, rect.top + h - r.bottom) * k
  const left = Math.max(0, r.left - rect.left) * k
  const radius = (Number.parseFloat(style.borderTopLeftRadius) || 0) * k
  return { rect, visible: r, clip: `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)` }
}

const NO_CLIP = 'inset(0px 0px 0px 0px round 0px)'

function fade(el: Element | null, from: number, to: number) {
  return el?.animate([{ opacity: from }, { opacity: to }], { duration: DURATION, easing: EASE, fill: 'forwards' }).finished
}

// Scroll lock. Without scrollbar-gutter: stable on <html> the scrollbar disappears and
// the page would jump — its width is compensated with padding on <body>
const root = document.documentElement
const restore = { overflow: root.style.overflow, paddingRight: document.body.style.paddingRight }
function lockScroll() {
  const bar = window.innerWidth - root.clientWidth
  if (bar > 0 && !getComputedStyle(root).scrollbarGutter?.startsWith('stable'))
    document.body.style.paddingRight = `${Number.parseFloat(getComputedStyle(document.body).paddingRight) + bar}px`
  root.style.overflow = 'hidden'
}
function unlockScroll() {
  root.style.overflow = restore.overflow
  document.body.style.paddingRight = restore.paddingRight
}

// Focus returns here when there is no page element to return it to
const returnFocus = document.activeElement as HTMLElement | null

onMounted(() => {
  trackX.value = -pos.value * slideWidth.value
  lockScroll()
  root.classList.add(options.openClass)
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  const item = current.value
  if (item?.element)
    item.element.style.visibility = 'hidden'
  stage.value?.focus({ preventScroll: true })

  const frame = frameEl()
  if (!item || !frame || !animated)
    return
  const box = frameBox(item)
  const shape = pageShape(item, box)
  if (shape && onScreen(shape.visible)) {
    frame.animate([
      { transform: flip(shape.rect, box), transformOrigin: '0 0', clipPath: shape.clip },
      { transform: 'none', transformOrigin: '0 0', clipPath: NO_CLIP },
    ], { duration: DURATION, easing: EASE })
  }
  else {
    frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION, easing: EASE })
  }
  backdrop.value?.animate([{ opacity: 0 }, { opacity: options.bgOpacity }], { duration: DURATION, easing: EASE })
  ui.value?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION, easing: EASE })
})

// The controls fade out when the mouse rests for options.idleDelay — the image is left
// alone, with or without its caption. Only where there is a mouse (hover: hover): on a
// touch screen nothing moves between taps, and the controls would never come back.
// Keys bring them back too — a focused button must not be invisible. Over a button the
// timer doesn't run
const idle = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | undefined
const tracksIdle = options.idleDelay > 0 && window.matchMedia('(hover: hover)').matches

function wake(overControl = false) {
  idle.value = false
  clearTimeout(idleTimer)
  if (tracksIdle && !overControl)
    idleTimer = setTimeout(() => idle.value = true, options.idleDelay)
}

onMounted(() => wake())

onBeforeUnmount(() => {
  clearTimeout(idleTimer)
  stopMotion()
  unlockScroll()
  root.classList.remove(options.openClass)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

async function close() {
  if (phase.value === 'closing')
    return
  phase.value = 'closing'
  gesture.value = 'none'
  emit('close')
  stopMotion()
  if (isFullscreen.value)
    void document.exitFullscreen()

  const item = current.value
  const frame = frameEl()
  if (item && frame && animated) {
    // Fly from where the frame is seen now (it may have been dragged down) into the
    // thumbnail — even when it's off screen: the image then leaves down or up, where it
    // lies on the page. It only fades when there is no thumbnail at all
    const box = frameBox(item)
    const now = frame.getBoundingClientRect()
    const shape = pageShape(item, box)
    const zoomer = frame.firstElementChild as HTMLElement | null
    if (zoomer)
      zoomer.style.transform = ''
    const flight = shape
      ? frame.animate([
          { transform: flip(now, box), transformOrigin: '0 0', clipPath: NO_CLIP },
          { transform: flip(shape.rect, box), transformOrigin: '0 0', clipPath: shape.clip },
        ], { duration: DURATION, easing: EASE, fill: 'forwards' })
      : frame.animate([
          { transform: flip(now, box), transformOrigin: '0 0', opacity: 1 },
          { transform: flip(now, box), transformOrigin: '0 0', opacity: 0 },
        ], { duration: DURATION, easing: EASE, fill: 'forwards' })
    await Promise.all([flight.finished, fade(backdrop.value, bgOpacity.value, 0), fade(ui.value, 1, 0)])
  }

  if (item?.element) {
    item.element.style.visibility = ''
    item.element.focus({ preventScroll: true })
  }
  else {
    returnFocus?.focus({ preventScroll: true })
  }
  emit('closed')
}

// Custom buttons. An icon given as a name is drawn by Nuxt Icon — its global Icon
// component, also behind Nuxt UI's UIcon. It's looked up only when a name is used, so
// without Nuxt Icon the module works as long as icons are components
const iconByName = options.buttons.some(button => typeof button.icon === 'string')
  ? resolveDynamicComponent('Icon')
  : undefined
if (typeof iconByName === 'string')
  console.warn('[nuxt-image-viewer] Button icons given as names need Nuxt Icon (@nuxt/icon, included in Nuxt UI). Install it or pass an icon component.')

const buttons = options.buttons.map(button => typeof button.icon === 'string'
  ? { ...button, iconComponent: typeof iconByName === 'string' ? undefined : iconByName, iconName: button.icon }
  : { ...button, iconComponent: button.icon, iconName: undefined })

// The ends of a strip that isn't endless: the arrow that way is off
const atFirst = computed(() => !loop && pos.value === 0)
const atLast = computed(() => !loop && pos.value === total - 1)

// Your own arrows (options.controls) sit in a wrapper that places them and scrolls on a
// click bubbling from them — the component itself needs nothing. At the ends the
// wrapper is aria-disabled: dimmed, out of the Tab round, and its click does nothing.
// Not inert: an inert wrapper lets the click through to the backdrop, which closes
function ownArrowClick(delta: -1 | 1) {
  if (!(delta < 0 ? atFirst.value : atLast.value))
    step(delta)
}

// Buttons and arrow wrappers are not the backdrop: a press on them starts no gesture
function isControl(target: EventTarget | null) {
  return !!(target as Element | null)?.closest('button, .image-viewer__arrow')
}

// An icon-only button among your own arrows gets its accessible name from the labels
function nameOwnArrows() {
  for (const [side, label] of [['prev', options.labels.prev], ['next', options.labels.next]] as const) {
    const button = stage.value?.querySelector(`div.image-viewer__arrow--${side} :is(button, [role="button"])`)
    if (button && !button.hasAttribute('aria-label') && !button.textContent?.trim())
      button.setAttribute('aria-label', label)
  }
}

onMounted(nameOwnArrows)

// A custom button with a text grows from a round icon button into a pill
function buttonClass(button: ImageViewerButton) {
  return [`image-viewer__button--${button.name}`, { 'image-viewer__button--has-text': button.text }]
}

// A custom button acts on the current image and may close the viewer
function runButton(button: ImageViewerButton) {
  const item = current.value
  if (item)
    button.onClick({ item, index: index.value, close })
}

function onKeydown(event: KeyboardEvent) {
  wake()
  if (event.key === 'Escape')
    void close()
  else if (event.key === 'ArrowLeft')
    step(-1)
  else if (event.key === 'ArrowRight')
    step(1)
  else if (event.key === 'Tab')
    trapFocus(event)
  else
    return
  event.preventDefault()
}

// Focus stays inside the dialog: Tab goes round its buttons
function trapFocus(event: KeyboardEvent) {
  const buttons = [...stage.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []]
    .filter(button => button.offsetParent && !button.closest('[aria-disabled="true"]'))
  if (!buttons.length)
    return
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const next = event.shiftKey ? (at <= 0 ? buttons.length - 1 : at - 1) : (at + 1) % buttons.length
  buttons[next]!.focus()
}

// Gestures. The direction is decided once, by the first pixels of movement
const pointers = new Map<number, { x: number, y: number }>()
let start = { x: 0, y: 0, panX: 0, panY: 0, scale: 1, dist: 1, cx: 0, cy: 0, trackX: 0, closeY: 0 }
let last = { x: 0, y: 0, t: 0 }
let velocity = { x: 0, y: 0 }
let moved = false
let lastTap = { t: 0, x: 0, y: 0 }
// The pointer is captured by the viewer layer, and the release comes from it — whether
// the press was on the image or outside is remembered on press
let downOnImage = false

// Past the limit the image and the strip follow the finger with friction
function withFriction(value: number, bound: number) {
  if (value > bound)
    return bound + (value - bound) * EDGE_FRICTION
  if (value < -bound)
    return -bound + (value + bound) * EDGE_FRICTION
  return value
}

function beginSingle(x: number, y: number) {
  start = { ...start, x, y, panX: pan.x, panY: pan.y, scale: scale.value, trackX: trackX.value, closeY: closeY.value }
  last = { x, y, t: performance.now() }
  velocity = { x: 0, y: 0 }
}

function onPointerDown(event: PointerEvent) {
  if (phase.value !== 'open' || isControl(event.target))
    return
  stage.value?.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  // Catch the strip and the image in flight: the gesture continues from where they are
  stopMotion()

  if (pointers.size === 1) {
    beginSingle(event.clientX, event.clientY)
    downOnImage = !!(event.target as Element).closest('.image-viewer__zoom')
    moved = false
    gesture.value = 'none'
  }
  else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()] as [{ x: number, y: number }, { x: number, y: number }]
    start = { ...start, panX: pan.x, panY: pan.y, scale: scale.value, dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }
    moved = true
    settleTrack()
    closeY.value = 0
    gesture.value = 'pinch'
  }
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'mouse')
    wake(isControl(event.target))
  if (!pointers.has(event.pointerId))
    return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (gesture.value === 'pinch') {
    const [a, b] = [...pointers.values()] as [{ x: number, y: number }, { x: number, y: number } | undefined]
    if (!b)
      return
    const item = current.value
    const next = Math.min(Math.max(start.scale * Math.hypot(a.x - b.x, a.y - b.y) / start.dist, 0.7), (item ? zoomLimit(item) : 2) * 1.3)
    const cx = (a.x + b.x) / 2 - W.value / 2
    const cy = (a.y + b.y) / 2 - H.value / 2
    const sx = start.cx - W.value / 2
    const sy = start.cy - H.value / 2
    pan.x = cx - (sx - start.panX) * (next / start.scale)
    pan.y = cy - (sy - start.panY) * (next / start.scale)
    scale.value = next
    return
  }

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (gesture.value === 'none') {
    if (Math.hypot(dx, dy) < 6)
      return
    moved = true
    gesture.value = zoomed.value ? 'pan' : Math.abs(dx) > Math.abs(dy) || !options.closeOnVerticalDrag ? 'swipe' : 'close'
  }

  const now = performance.now()
  const dt = Math.max(1, now - last.t)
  velocity = { x: (event.clientX - last.x) / dt * 0.8 + velocity.x * 0.2, y: (event.clientY - last.y) / dt * 0.8 + velocity.y * 0.2 }
  last = { x: event.clientX, y: event.clientY, t: now }

  if (gesture.value === 'pan') {
    const bounds = panBounds()
    pan.x = withFriction(start.panX + dx, bounds.x)
    pan.y = withFriction(start.panY + dy, bounds.y)
  }
  else if (gesture.value === 'swipe') {
    // The edge slide has no neighbour — the strip follows the finger with friction
    const base = -pos.value * slideWidth.value
    const shift = start.trackX - base + dx
    const atEdge = !loop && ((pos.value === 0 && shift > 0) || (pos.value === total - 1 && shift < 0))
    trackX.value = base + (atEdge ? shift * EDGE_FRICTION : shift)
  }
  else if (gesture.value === 'close') {
    closeY.value = start.closeY + dy * VERTICAL_DRAG_FRICTION
  }
}

function onPointerUp(event: PointerEvent) {
  if (!pointers.delete(event.pointerId))
    return

  if (gesture.value === 'pinch') {
    // One finger lifted — the other can pan the zoomed image right away
    const rest = [...pointers.values()][0]
    if (rest) {
      beginSingle(rest.x, rest.y)
      gesture.value = zoomed.value ? 'pan' : 'none'
      return
    }
    gesture.value = 'none'
    zoomTo(scale.value)
    return
  }
  if (pointers.size)
    return

  const finished = gesture.value
  gesture.value = 'none'
  // The finger stopped before lifting — no throw
  if (performance.now() - last.t > 80)
    velocity = { x: 0, y: 0 }

  if (finished === 'swipe') {
    // The slide switches on a fast throw or with more than half of the neighbour already on
    // screen. The throw is judged by the direction of this gesture, not by the strip
    // position: when swiping without a pause the strip is still catching up with the
    // previous slide, and a flick that didn't cover the lag was lost
    const ratio = (trackX.value + pos.value * slideWidth.value) / W.value
    const v = velocity.x
    const dx = last.x - start.x
    let delta = 0
    if ((v < -MIN_NEXT_SLIDE_SPEED && dx < 0) || (v < 0.1 && ratio < -0.5))
      delta = 1
    else if ((v > MIN_NEXT_SLIDE_SPEED && dx > 0) || (v > -0.1 && ratio > 0.5))
      delta = -1
    step(delta, delta > 0 ? Math.min(v, 0) : delta < 0 ? Math.max(v, 0) : v)
  }
  else if (finished === 'close') {
    // Close if with the throw the image would go past the threshold the same way
    const third = H.value / 3
    const ratio = closeY.value / third
    const projected = (closeY.value + project(velocity.y)) / third
    if ((ratio > 0 && projected > MIN_RATIO_TO_CLOSE) || (ratio < 0 && projected < -MIN_RATIO_TO_CLOSE)) {
      void close()
    }
    else {
      stopClose()
      stopClose = spring(closeY.value, 0, velocity.y, y => closeY.value = y)
    }
  }
  else if (finished === 'pan') {
    // A throw continues the movement and fades out; at the edge — a spring with a slight bounce
    const bounds = panBounds()
    for (const axis of ['x', 'y'] as const) {
      const projected = pan[axis] + project(velocity[axis])
      const corrected = Math.min(bounds[axis], Math.max(-bounds[axis], projected))
      if (corrected === pan[axis])
        continue
      panSprings.value++
      stopPan.push(spring(pan[axis], corrected, velocity[axis], (value) => {
        pan[axis] = value
        if (value === corrected)
          panSprings.value = Math.max(0, panSprings.value - 1)
      }, { damping: corrected === projected ? 1 : 0.82 }))
    }
  }
  else if (!moved) {
    tap(event)
  }
}

// Click or tap. Outside the image — close. On the image with a mouse — zoom, with a
// finger — by a double tap: a single tap on the image does nothing on a phone
function tap(event: PointerEvent) {
  if (!downOnImage) {
    if (options.closeOnBackdropClick)
      void close()
    return
  }
  const point = { x: event.clientX, y: event.clientY }
  if (event.pointerType === 'mouse') {
    toggleZoom(point)
    return
  }
  const now = performance.now()
  if (now - lastTap.t < 300 && Math.hypot(point.x - lastTap.x, point.y - lastTap.y) < 30) {
    toggleZoom(point)
    lastTap = { t: 0, x: 0, y: 0 }
  }
  else {
    lastTap = { t: now, ...point }
  }
}

function onWheel(event: WheelEvent) {
  if (phase.value === 'open')
    zoomTo(scale.value * Math.exp(-event.deltaY * 0.002), { x: event.clientX, y: event.clientY })
}

defineExpose({ close, next: () => step(1), prev: () => step(-1), goTo })
</script>

<template>
  <div
    ref="stage"
    role="dialog"
    aria-modal="true"
    :aria-label="options.labels.dialog"
    tabindex="-1"
    class="image-viewer"
    :class="{
      'image-viewer--zoomed': zoomed,
      'image-viewer--closing': phase === 'closing',
      'image-viewer--idle': idle,
      'image-viewer--idle-caption': idle && options.idleHidesCaption,
    }"
    :style="{ zIndex: options.zIndex }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @wheel.prevent="onWheel"
  >
    <div
      ref="backdrop"
      class="image-viewer__backdrop"
      :style="{ opacity: bgOpacity }"
    />

    <div
      class="image-viewer__track"
      :style="trackStyle"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        class="image-viewer__slide"
        :class="{ 'image-viewer__slide--current': i === index }"
        :aria-hidden="i !== index"
        :style="{ left: `${slot(i) * slideWidth}px`, width: `${W}px` }"
      >
        <div
          :data-frame="i"
          class="image-viewer__frame"
          :style="{
            left: `${frameBox(item).left}px`,
            top: `${frameBox(item).top}px`,
            width: `${frameBox(item).w}px`,
            height: `${frameBox(item).h}px`,
            ...(i === index ? closeStyle : {}),
          }"
        >
          <div
            class="image-viewer__zoom"
            :style="i === index ? zoomStyle : undefined"
          >
            <img
              :src="item.thumb"
              :alt="item.alt"
              draggable="false"
              class="image-viewer__img image-viewer__img--thumb"
            >

            <img
              v-if="item.src !== item.thumb && (near(i) || loaded.has(i))"
              :src="item.src"
              alt=""
              draggable="false"
              class="image-viewer__img image-viewer__img--full"
              :class="{ 'image-viewer__img--loaded': loaded.has(i) }"
              @load="loaded.add(i)"
            >
          </div>
        </div>
      </div>
    </div>

    <div
      ref="ui"
      class="image-viewer__ui"
    >
      <div class="image-viewer__toolbar">
        <span
          v-if="options.ui.counter && total > 1"
          class="image-viewer__counter"
          aria-live="polite"
        >
          {{ index + 1 }} / {{ total }}
        </span>

        <div class="image-viewer__buttons">
          <button
            v-for="button in buttons"
            :key="button.name"
            type="button"
            class="image-viewer__button"
            :class="buttonClass(button)"
            :aria-label="button.label"
            @click="runButton(button)"
          >
            <component
              :is="button.iconComponent"
              v-if="button.iconComponent"
              :name="button.iconName"
              class="image-viewer__button-icon"
              aria-hidden="true"
            />

            <span
              v-if="button.text"
              class="image-viewer__button-text"
            >{{ button.text }}</span>
          </button>

          <button
            v-if="options.ui.zoom"
            type="button"
            class="image-viewer__button image-viewer__button--zoom"
            :aria-label="zoomed ? options.labels.zoomOut : options.labels.zoomIn"
            @click="toggleZoom()"
          >
            <svg
              class="image-viewer__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path :d="zoomed ? 'M15 15L21 21M8 11H14M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z' : 'M15 15L21 21M11 8V14M8 11H14M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z'" />
            </svg>
          </button>

          <button
            v-if="options.ui.fullscreen && canFullscreen"
            type="button"
            class="image-viewer__button image-viewer__button--fullscreen"
            :aria-label="isFullscreen ? options.labels.exitFullscreen : options.labels.fullscreen"
            @click="toggleFullscreen()"
          >
            <svg
              class="image-viewer__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path :d="isFullscreen ? 'M9 4V9H4M20 9H15V4M15 20V15H20M4 15H9V20' : 'M4 9V4H9M15 4H20V9M20 15V20H15M9 20H4V15'" />
            </svg>
          </button>

          <button
            v-if="options.ui.close"
            type="button"
            class="image-viewer__button image-viewer__button--close"
            :aria-label="options.labels.close"
            @click="close()"
          >
            <svg
              class="image-viewer__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18 18L12 12M12 12L6 6M12 12L18 6M12 12L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <template v-if="options.ui.arrows && total > 1">
        <div
          v-if="options.controls.prev"
          class="image-viewer__arrow image-viewer__arrow--prev image-viewer__arrow--own"
          :aria-disabled="atFirst"
          @click="ownArrowClick(-1)"
        >
          <component :is="options.controls.prev" />
        </div>

        <button
          v-else
          type="button"
          class="image-viewer__button image-viewer__arrow image-viewer__arrow--prev"
          :aria-label="options.labels.prev"
          :disabled="atFirst"
          @click="step(-1)"
        >
          <svg
            class="image-viewer__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M15 19L8 12L15 5" />
          </svg>
        </button>

        <div
          v-if="options.controls.next"
          class="image-viewer__arrow image-viewer__arrow--next image-viewer__arrow--own"
          :aria-disabled="atLast"
          @click="ownArrowClick(1)"
        >
          <component :is="options.controls.next" />
        </div>

        <button
          v-else
          type="button"
          class="image-viewer__button image-viewer__arrow image-viewer__arrow--next"
          :aria-label="options.labels.next"
          :disabled="atLast"
          @click="step(1)"
        >
          <svg
            class="image-viewer__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M9 5L16 12L9 19" />
          </svg>
        </button>
      </template>

      <div
        v-if="options.ui.caption && current?.caption"
        class="image-viewer__caption"
      >
        <span class="image-viewer__caption-text">{{ current.caption }}</span>
      </div>
    </div>
  </div>
</template>
