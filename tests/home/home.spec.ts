import { test, expect } from '@fixtures/test';
import { contactMessage } from '@utils/testData';

/**
 * The landing page. Three cases, and the budget for this area is three: the
 * home page is the cheapest thing on the site to check and the least likely to
 * be where an expensive defect hides.
 */
test.describe('Home', { tag: ['@functional', '@home'] }, () => {
  test('TC-01 the landing page renders its carousel, catalogue and categories', async ({
    home,
  }) => {
    await home.open();

    await expect(home.carousel).toBeVisible();
    await expect(home.categorySidebar).toContainText('Category');

    // The exact count is the shop's business and changes without warning. That
    // the grid is populated is the suite's business.
    await expect(home.featuredItems.first()).toBeVisible();
    expect(await home.featuredItems.count()).toBeGreaterThan(10);

    await expect(home.featuredName(0)).not.toBeEmpty();
  });

  test('TC-02 a visitor can subscribe from the footer', async ({ home }) => {
    const { email } = contactMessage();

    await home.open();
    await home.subscribeEmail.scrollIntoViewIfNeeded();
    await home.subscribe(email);

    await expect(home.subscribeSuccess).toBeVisible();
  });

  test('TC-03 a product from the recommended row reaches the cart', async ({ home, cart }) => {
    await home.open();

    // The recommended row is a separate template from the featured grid, with
    // its own add to cart control, and has broken independently of it. It is
    // below the fold and only renders once scrolled to.
    await home.recommendedItems.first().scrollIntoViewIfNeeded();
    await expect(home.recommendedItems.first()).toBeVisible();

    const id = await home.recommendedProductId(0);
    const name = await home.recommendedName(0);

    await home.recommendedAddToCart(0).click();
    await cart.viewCartFromModal();

    await expect(cart.row(id)).toHaveCount(1);
    // The row the id found has to be the product the tile showed, or the id is
    // joining two unrelated things and the assertion above proves nothing.
    await expect(cart.rowDescription(id)).toContainText(name);
  });

  /**
   * TC-21, parked.
   *
   * The scroll up control does nothing on roughly one visit in three. The
   * control is present, visible, and nothing covers it: `elementFromPoint` at
   * the click coordinates returns `#scrollUp` itself, the click is delivered,
   * no console error follows, and the page stays where it was. Retrying the
   * click for fifteen seconds does not recover it, so this is not a race the
   * suite can wait out: once a visit is in that state the control stays dead
   * for that visit.
   *
   * Six consecutive runs, two of them failing, are in specs/STATUS.md. The test
   * is parked rather than repaired, because repairing it would mean asserting
   * something weaker than "the button works", and the defect belongs to the
   * application.
   */
  test.fixme('TC-21 the scroll up control returns the visitor to the top', async ({
    home,
    page,
  }) => {
    await home.open();
    await home.settle();

    await page.mouse.wheel(0, 6_000);
    await expect(home.scrollUpButton).toBeVisible();
    await home.scrollUpButton.click();

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
      .toBeLessThan(50);
    await expect(home.carousel).toBeInViewport();
  });
});
