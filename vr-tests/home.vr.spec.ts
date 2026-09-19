import { test, expect } from '@fixtures/test';
import { adMasks, readyForCapture } from '@utils/visual';

/**
 * Visual coverage of the landing page.
 *
 * Every case captures a component rather than the whole page. A full page
 * screenshot fails on any change anywhere in it, so the report says "the home
 * page changed" and a person still has to go and find out what. A component
 * capture names the thing that moved.
 */
test.describe('Visual: home', { tag: ['@visual', '@home'] }, () => {
  test.beforeEach(async ({ home, page }) => {
    await home.open();
    await readyForCapture(page);
  });

  test('VR-01 header and navigation', async ({ page }) => {
    await expect(page.locator('#header')).toHaveScreenshot('header.png', {
      mask: adMasks(page),
    });
  });

  test('VR-02 hero carousel, first slide', async ({ home, page }) => {
    await expect(home.carousel).toHaveScreenshot('carousel.png', { mask: adMasks(page) });
  });

  test('VR-03 category and brand sidebar', async ({ home, page }) => {
    await expect(home.categorySidebar).toHaveScreenshot('sidebar.png', { mask: adMasks(page) });
  });

  test('VR-04 a catalogue tile', async ({ home, page }) => {
    // One tile rather than the grid. The catalogue grows, and a baseline of the
    // whole grid would have to be regenerated every time the shop adds a
    // product, which trains everyone to regenerate baselines without looking.
    await expect(home.featuredItems.first()).toHaveScreenshot('catalogue-tile.png', {
      mask: adMasks(page),
    });
  });

  test('VR-05 footer and subscription box', async ({ page }) => {
    // .footer-widget rather than #footer: the advertiser injects a container as
    // the footer's first child, and capturing the footer itself would put that
    // container inside the baseline.
    await expect(page.locator('.footer-widget')).toHaveScreenshot('footer.png', {
      mask: adMasks(page),
    });
  });
});
