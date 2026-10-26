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
    // Two images — no endless strip, the next arrow is disabled on the last one
    expect(await page.locator('.image-viewer__arrow--next').isDisabled()).toBe(true)

    await page.getByRole('button', { name: 'Shut' }).click()
    await page.getByRole('dialog').waitFor({ state: 'detached' })
    expect(await page.locator('#state').textContent()).toBe('false:1')
    await page.close()
  })
})
