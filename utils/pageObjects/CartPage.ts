import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { Path, Title } from '../url.js';

/**
 * The cart, and the modal that stands between adding a product and getting to
 * it.
 *
 * The modal is the single most load bearing object in this suite. Adding a
 * product opens it, and the next action of every case that adds more than one
 * product is dismissing it. A case that forgets loses its next click to the
 * backdrop and fails somewhere else entirely, which is exactly the kind of
 * failure that gets misfiled as flake.
 */
export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ---------- the added-to-cart modal ----------

  get modal(): Locator {
    return this.page.locator('#cartModal');
  }

  get modalContinue(): Locator {
    return this.modal.getByRole('button', { name: /Continue Shopping/i });
  }

  get modalViewCart(): Locator {
    return this.modal.getByRole('link', { name: /View Cart/i });
  }

  /** Close the modal and wait for it to actually be gone, not merely fading. */
  async continueShopping(): Promise<void> {
    await expect(this.modal).toBeVisible();
    await this.modalContinue.click();
    await expect(this.modal).toBeHidden();
  }

  async viewCartFromModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
    await this.modalViewCart.click();
    await this.page.waitForURL(`**${Path.cart}`);
  }

  // ---------- the cart itself ----------

  get table(): Locator {
    return this.page.locator('#cart_info_table');
  }

  get rows(): Locator {
    return this.page.locator('#cart_info_table tbody tr');
  }

  get emptyMessage(): Locator {
    return this.page.locator('#empty_cart');
  }

  get proceedToCheckout(): Locator {
    return this.page.getByText('Proceed To Checkout');
  }

  /**
   * Rows are addressed by product id, never by displayed name.
   *
   * The catalogue tiles carry advertiser injected markup inside the product
   * title, so a name scraped from a tile is sometimes the product's and
   * sometimes the product's plus a word the advertiser chose. Matching a cart
   * row on such a string once produced an empty filter that matched every row,
   * and the case failed three assertions later on a count nobody could explain.
   *
   * The application gives both ends a stable id of its own: `data-product-id`
   * on the tile's add to cart control, and `id="product-<id>"` on the cart row.
   * Joining on that is immune to anything the advertiser does.
   */
  row(productId: number): Locator {
    return this.page.locator(`#product-${productId}`);
  }

  rowDescription(productId: number): Locator {
    return this.row(productId).locator('.cart_description h4 a');
  }

  rowPrice(productId: number): Locator {
    return this.row(productId).locator('.cart_price');
  }

  rowQuantity(productId: number): Locator {
    return this.row(productId).locator('.cart_quantity');
  }

  rowTotal(productId: number): Locator {
    return this.row(productId).locator('.cart_total_price');
  }

  rowDelete(productId: number): Locator {
    return this.row(productId).locator('.cart_quantity_delete');
  }

  async open(): Promise<void> {
    await this.goto(Path.cart);
    await expect(this.page).toHaveTitle(Title.cart);
  }

  async remove(productId: number): Promise<void> {
    const row = this.row(productId);
    await expect(row).toHaveCount(1);
    await this.rowDelete(productId).click();
    await expect(row).toHaveCount(0);
  }
}
