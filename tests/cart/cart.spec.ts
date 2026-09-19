import { test, expect } from '@fixtures/test';
import { contactMessage, Products } from '@utils/testData';

/**
 * The cart. Five of the twenty cases are here, the largest share of any area,
 * because this is where the money is and where the defects this suite has
 * actually found have been.
 *
 * Every assertion joins on the application's product id rather than on the
 * displayed name. The reason is written up on CartPage.row: the catalogue tiles
 * carry advertiser injected markup inside the title, and a name scraped from
 * one is not reliably the product's name.
 */
test.describe('Cart', { tag: ['@functional', '@cart'] }, () => {
  test('TC-14 two products added from the grid both arrive in the cart', async ({
    products,
    cart,
  }) => {
    await products.open();

    const first = await products.productIdOf(0);
    await products.addToCart(0).click();
    await cart.continueShopping();

    const second = await products.productIdOf(1);
    await products.addToCart(1).click();
    await cart.viewCartFromModal();

    await expect(cart.rows).toHaveCount(2);
    await expect(cart.row(first)).toHaveCount(1);
    await expect(cart.row(second)).toHaveCount(1);
  });

  test('TC-15 the quantity chosen on the product page is the quantity in the cart', async ({
    details,
    cart,
  }) => {
    const wanted = 4;

    await details.open(Products.blueTop.id);
    await details.setQuantity(wanted);
    await details.addToCart.click();
    await cart.viewCartFromModal();

    await expect(cart.rowQuantity(Products.blueTop.id)).toHaveText(String(wanted));

    // The line total has to agree with the quantity, or the cart is telling the
    // customer one thing and the checkout another.
    const unit = Number(Products.blueTop.price.replace(/\D/g, ''));
    await expect(cart.rowTotal(Products.blueTop.id)).toContainText(String(unit * wanted));
  });

  test('TC-16 removing the only product leaves the cart empty, not stale', async ({
    products,
    cart,
  }) => {
    await products.open();
    const id = await products.productIdOf(0);

    await products.addToCart(0).click();
    await cart.viewCartFromModal();
    await expect(cart.rows).toHaveCount(1);

    await cart.remove(id);

    await expect(cart.emptyMessage).toBeVisible();
    await expect(cart.emptyMessage).toContainText('Cart is empty');
  });

  test('TC-17 the cart survives navigating away and back', async ({ products, cart, home }) => {
    await products.open();
    const id = await products.productIdOf(0);

    await products.addToCart(0).click();
    await cart.continueShopping();

    await home.open();
    await home.openCart();

    await expect(cart.row(id)).toHaveCount(1);
  });

  test('TC-20 a visitor can subscribe from the cart page', async ({ cart }) => {
    const { email } = contactMessage();

    await cart.open();
    await cart.subscribeEmail.scrollIntoViewIfNeeded();
    await cart.subscribe(email);

    await expect(cart.subscribeSuccess).toBeVisible();
  });
});
