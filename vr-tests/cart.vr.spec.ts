import { test, expect } from '@fixtures/test';
import { Products } from '@utils/testData';
import { adMasks, readyForCapture } from '@utils/visual';

test.describe('Visual: cart', { tag: ['@visual', '@cart'] }, () => {
  /**
   * The checkout control rather than the empty cart.
   *
   * The empty cart was the original subject here and it is not capturable
   * against this target. Its message is a single centred paragraph, and the
   * advertiser injects an annotation widget inside that paragraph, which
   * re-centres the sentence by a different amount depending on whether the
   * widget arrived before the capture. Three consecutive runs disagreed with
   * the baseline and with each other. Removing the widget by class worked for
   * two of its shapes and not for the one used here.
   *
   * The empty cart is covered functionally by TC-16, which asserts the message
   * rather than photographing it. This case takes the checkout control instead,
   * which is the commercially important thing on the page and sits in a region
   * the advertiser does not write into. The finding is in specs/STATUS.md.
   */
  test('VR-11 the checkout control', async ({ products, cart, page }) => {
    await products.open();
    await products.addToCart(0).click();
    await cart.viewCartFromModal();
    await readyForCapture(page);

    await expect(page.locator('#do_action')).toHaveScreenshot('checkout-control.png', {
      mask: adMasks(page),
    });
  });

  test('VR-12 the added to cart modal', async ({ products, cart, page }) => {
    await products.open();
    await products.addToCart(0).click();
    await expect(cart.modal).toBeVisible();
    await readyForCapture(page);

    await expect(cart.modal.locator('.modal-content')).toHaveScreenshot('cart-modal.png');
  });

  test('VR-13 a cart row', async ({ details, cart, page }) => {
    await details.open(Products.blueTop.id);
    await details.addToCart.click();
    await cart.viewCartFromModal();
    await readyForCapture(page);

    await expect(cart.row(Products.blueTop.id)).toHaveScreenshot('cart-row.png', {
      mask: adMasks(page),
    });
  });

  test('VR-14 the cart table with two products', async ({ products, cart, page }) => {
    await products.open();
    await products.addToCart(0).click();
    await cart.continueShopping();
    await products.addToCart(1).click();
    await cart.viewCartFromModal();
    await readyForCapture(page);

    await expect(cart.table).toHaveScreenshot('cart-table.png', {
      mask: adMasks(page),
      // Two rows of product imagery, which the shop re-encodes from time to
      // time without changing the layout this case is watching.
      maxDiffPixelRatio: 0.02,
    });
  });
});
