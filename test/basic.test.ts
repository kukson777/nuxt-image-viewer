import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

describe('nuxt-image-viewer', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    browser: true,
    // Locally the system Edge, on CI the Chromium installed by playwright-core
    browserOptions: { type: 'chromium', launch: { channel: process.env.CI ? undefined : 'msedge' } },
  })

  it('renders ZoomImage with the viewer attributes', async () => {
    const html: string = await $fetch('/')
    expect(html).toMatch(/<img[^>]*src="\/a\.svg"[^>]*>/)
    const img = html.match(/<img[^>]*src="\/a\.svg"[^>]*>/)![0]
    expect(img).toMatch(/ data-image-viewer[ >]/)
    expect(img).toContain('data-image-viewer-src="/a.svg"')
    expect(img).toContain('data-image-viewer-width="800"')
    expect(img).toContain('data-image-viewer-height="600"')
    expect(img).toContain('data-image-viewer-caption="First"')
    expect(img).toContain('alt="First"')
    expect(img).toContain('tabindex="0"')
  })

  it('opens on click, scrolls with keys and closes on Escape', async () => {
    const page = await createPage('/')
    await page.click('img[data-image-viewer-src="/b.svg"]')
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    expect(await page.locator('.image-viewer__counter').textContent()).toContain('2 / 3')
    expect(await page.locator('.image-viewer__caption-text').textContent()).toBe('Second')
    expect(await page.evaluate(() => document.documentElement.classList.contains('image-viewer-open'))).toBe(true)

    await page.keyboard.press('ArrowRight')
    expect(await page.locator('.image-viewer__counter').textContent()).toContain('3 / 3')
    // Endless strip: after the last comes the first
    await page.keyboard.press('ArrowRight')
    expect(await page.locator('.image-viewer__counter').textContent()).toContain('1 / 3')

    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(() => document.documentElement.classList.contains('image-viewer-open'))).toBe(false)
    await page.close()
  })

  it('opens from code with useImageViewer and per-call options', async () => {
    const page = await createPage('/')
    await page.click('#open')
    await page.getByRole('dialog').waitFor()
    expect(await page.locator('#state').textContent()).toBe('true:1')
    // Two images — no endless strip: the next arrow (an own one, from configure()) is
    // off on the last image
    const next = page.locator('.image-viewer__arrow--next')
    expect(await next.getAttribute('aria-disabled')).toBe('true')
    // A click on it neither scrolls nor falls through to the backdrop and closes
    await next.click()
    await page.waitForTimeout(400)
    expect(await page.locator('#state').textContent()).toBe('true:1')

    await page.getByRole('button', { name: 'Shut' }).click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    expect(await page.locator('#state').textContent()).toBe('false:1')
    await page.close()
  })

  it('shows custom buttons from configure(), replaced per call', async () => {
    const page = await createPage('/')
    await page.click('img[data-image-viewer-src="/c.svg"]')
    await page.getByRole('dialog').waitFor()
    const mark = page.getByRole('button', { name: 'Mark' })
    expect(await mark.getAttribute('class')).toContain('image-viewer__button--mark')
    expect(await mark.getAttribute('class')).toContain('image-viewer__button--has-text')
    // An icon component is rendered as is
    expect(await page.getByRole('button', { name: 'Star' }).locator('svg[data-star-icon]').count()).toBe(1)

    // An own next arrow takes the place of the built-in one, gets the label and scrolls
    const next = page.locator('.image-viewer__arrow--next [data-own-arrow]')
    expect(await next.getAttribute('aria-label')).toBe('Next')
    expect(await page.locator('.image-viewer__button.image-viewer__arrow--next').count()).toBe(0)
    await next.click()
    expect(await page.locator('.image-viewer__counter').textContent()).toContain('1 / 3')
    // The button acts on the current image: the arrow went round from c to a
    await mark.click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    expect(await page.evaluate(() => document.body.dataset.marked)).toBe('/a.svg')

    // open() in the fixture passes buttons: [] — no custom button there
    await page.click('#open')
    await page.getByRole('dialog').waitFor()
    expect(await page.getByRole('button', { name: 'Mark' }).count()).toBe(0)
    await page.close()
  })

  it('takes the options of an ImageViewerGroup', async () => {
    const page = await createPage('/')
    const group = page.locator('section[data-test-group]')
    expect(await group.getAttribute('data-image-viewer-group')).toBe('')
    await group.locator('img').first().click()
    await page.getByRole('dialog').waitFor()

    // The group's own button replaces the configured ones; no counter
    expect(await page.getByRole('button', { name: 'Group button' }).count()).toBe(1)
    expect(await page.getByRole('button', { name: 'Mark' }).count()).toBe(0)
    expect(await page.locator('.image-viewer__counter').count()).toBe(0)
    // Only the three images of the group
    expect(await page.locator('.image-viewer__slide').count()).toBe(3)

    // The #next slot is the arrow: in the arrow's place, named from the labels, and it
    // scrolls by exactly one — a click handled twice would land on c
    const next = page.locator('.image-viewer__arrow--next [data-slot-arrow]')
    expect(await next.getAttribute('aria-label')).toBe('Next')
    await next.click()
    expect(await page.locator('.image-viewer__slide--current .image-viewer__img--thumb').getAttribute('src')).toContain('/b.svg')
    await page.close()
  })

  it('fades the controls out while the mouse rests', async () => {
    const page = await createPage('/')
    await page.click('#open')
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    const idle = () => dialog.evaluate(el => el.classList.contains('image-viewer--idle'))

    await page.mouse.move(200, 300)
    expect(await idle()).toBe(false)
    // idleDelay: 300 in the fixture
    await page.waitForTimeout(500)
    expect(await idle()).toBe(true)
    expect(await dialog.evaluate(el => el.classList.contains('image-viewer--idle-caption'))).toBe(true)

    await page.mouse.move(210, 310)
    expect(await idle()).toBe(false)

    // Over a button the controls stay
    await page.getByRole('button', { name: 'Shut' }).hover()
    await page.waitForTimeout(500)
    expect(await idle()).toBe(false)
    await page.close()
  })
})
