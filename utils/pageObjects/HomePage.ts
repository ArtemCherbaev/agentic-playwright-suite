import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { Path, Title } from '../url.js';
import { productName } from '../text.js';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get carousel(): Locator {
    return this.page.locator('#slider-carousel');
  }

  get featuredItems(): Locator {
    return this.page.locator('.features_items .product-image-wrapper');
  }

  get recommendedItems(): Locator {
    return this.page.locator('.recommended_items .product-image-wrapper');
  }

  get categorySidebar(): Locator {
    return this.page.locator('.left-sidebar');
  }

  get scrollUpButton(): Locator {
    return this.page.locator('#scrollUp');
  }

  /** The add to cart control of the nth featured product, 0 based. */
  featuredAddToCart(index: number): Locator {
    return this.featuredItems.nth(index).locator('.productinfo a.add-to-cart');
  }

  featuredName(index: number): Locator {
    return this.featuredItems.nth(index).locator('.productinfo p');
  }

  recommendedAddToCart(index: number): Locator {
    return this.recommendedItems.nth(index).locator('a.add-to-cart');
  }

  /** The application's own id for a recommended tile. See CartPage.row. */
  async recommendedProductId(index: number): Promise<number> {
    const raw = await this.recommendedAddToCart(index).getAttribute('data-product-id');
    expect(raw, 'a recommended tile should carry data-product-id').toBeTruthy();
    return Number(raw);
  }

  /** The product name with the advertiser's annotations removed. See utils/text.ts. */
  async recommendedName(index: number): Promise<string> {
    return productName(this.recommendedItems.nth(index).locator('.productinfo p'));
  }

  async open(): Promise<void> {
    await this.goto(Path.home);
    await expect(this.page).toHaveTitle(Title.home);
  }
}
