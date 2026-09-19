import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { Path, Title } from '../url.js';
import { productName } from '../text.js';

export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get searchInput(): Locator {
    return this.page.locator('#search_product');
  }

  get searchButton(): Locator {
    return this.page.locator('#submit_search');
  }

  get items(): Locator {
    return this.page.locator('.features_items .product-image-wrapper');
  }

  get sectionTitle(): Locator {
    return this.page.locator('.features_items .title');
  }

  get categoryPanel(): Locator {
    return this.page.locator('#accordian');
  }

  get brandPanel(): Locator {
    return this.page.locator('.brands_products');
  }

  /** "Add to cart" on the grid tile, which is a different control from the one
   *  on the product page and has failed independently of it. */
  addToCart(index: number): Locator {
    return this.items.nth(index).locator('.productinfo a.add-to-cart');
  }

  viewProduct(index: number): Locator {
    return this.items.nth(index).getByRole('link', { name: 'View Product' });
  }

  itemName(index: number): Locator {
    return this.items.nth(index).locator('.productinfo p');
  }

  /**
   * Deliberately not `exact: true`.
   *
   * The toggle is `<a><span class="badge"><i class="fa fa-plus"></i></span> Women </a>`.
   * Once the Font Awesome stylesheet applies, the icon's generated content
   * joins the accessible name and an exact match stops resolving; before it
   * applies, the name is just "Women" and an exact match works. The suite hit
   * both outcomes on consecutive runs of the same commit. A substring match is
   * correct at either moment, and the three toggles are distinct enough that it
   * costs no precision. Written up in docs/decisions.md.
   */
  categoryToggle(name: string): Locator {
    return this.categoryPanel.getByRole('link', { name });
  }

  subCategoryLink(group: string, name: string): Locator {
    return this.page.locator(`#${group}`).getByRole('link', { name: new RegExp(`^${name}\\s*$`) });
  }

  /**
   * Open a sub category from the sidebar.
   *
   * The panels are Bootstrap collapses. A sub category link is present and
   * reported visible while the panel is still animating open, and a click sent
   * then lands on a moving target and times out. Waiting for the `in` class is
   * waiting for the widget's own definition of finished, rather than for a
   * duration someone guessed.
   */
  async openCategory(group: 'Women' | 'Men' | 'Kids', subCategory: string): Promise<void> {
    // The retry is for the advertiser, not for the widget.
    //
    // On WebKit this navigation is intermittently swallowed by Google's
    // vignette interstitial: the click lands, a full screen advertisement opens
    // over the page, and the address becomes `/products#google_vignette` rather
    // than the category. Nothing in the application went wrong and nothing in
    // the suite can prevent it. A visitor who meets that interstitial closes it
    // and clicks the category again, which is what this does.
    await expect(async () => {
      await this.dismissVignette();

      await this.categoryToggle(group).click();
      await expect(this.page.locator(`#${group}`)).toHaveClass(/\bin\b/);

      const link = this.subCategoryLink(group, subCategory);
      await expect(link).toBeVisible();
      await link.click();

      await expect(this.page).toHaveURL(/category_products/);
    }).toPass({ timeout: 40_000, intervals: [500, 1_000, 2_000] });
  }

  /**
   * The application's own id for the tile, taken from the control that adds it
   * to the cart. This is what cart assertions join on; see CartPage.row.
   */
  async productIdOf(index: number): Promise<number> {
    const raw = await this.addToCart(index).getAttribute('data-product-id');
    expect(raw, 'a catalogue tile should carry data-product-id').toBeTruthy();
    return Number(raw);
  }

  /** The product name with the advertiser's annotations removed. See utils/text.ts. */
  async nameOf(index: number): Promise<string> {
    return productName(this.itemName(index));
  }

  brandLink(name: string): Locator {
    return this.brandPanel.getByRole('link', { name: new RegExp(`${name}\\s*$`) });
  }

  async open(): Promise<void> {
    await this.goto(Path.products);
    await expect(this.page).toHaveTitle(Title.products);
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await expect(this.sectionTitle).toHaveText(/searched products/i);
  }
}
