import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { Path, Title } from '../url.js';

export class ProductDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get information(): Locator {
    return this.page.locator('.product-information');
  }

  get name(): Locator {
    return this.information.getByRole('heading', { level: 2 });
  }

  get price(): Locator {
    return this.information.locator('span span');
  }

  /**
   * The specification lines are `<p><b>Label:</b> value</p>`. Matching on the
   * text alone selects the <b>, which contains the label and none of the value,
   * so an assertion on it can only ever fail. Filtering paragraphs gives the
   * line a reader would point at.
   */
  private specLine(label: string): Locator {
    return this.information.locator('p').filter({ hasText: new RegExp(`^${label}:`) });
  }

  get category(): Locator {
    return this.specLine('Category');
  }

  get availability(): Locator {
    return this.specLine('Availability');
  }

  get condition(): Locator {
    return this.specLine('Condition');
  }

  get brand(): Locator {
    return this.specLine('Brand');
  }

  get quantity(): Locator {
    return this.page.locator('#quantity');
  }

  get addToCart(): Locator {
    return this.information.getByRole('button', { name: /Add to cart/i });
  }

  // ---------- review ----------

  get reviewName(): Locator {
    return this.page.locator('#name');
  }

  get reviewEmail(): Locator {
    return this.page.locator('#email');
  }

  get reviewText(): Locator {
    return this.page.locator('#review');
  }

  get reviewSubmit(): Locator {
    return this.page.locator('#button-review');
  }

  get reviewSuccess(): Locator {
    return this.page.getByText('Thank you for your review.');
  }

  async open(id: number): Promise<void> {
    await this.goto(Path.productDetails(id));
    await expect(this.page).toHaveTitle(Title.productDetails);
  }

  async setQuantity(value: number): Promise<void> {
    await this.quantity.fill(String(value));
    // The control is a plain number input with no change handler; filling it is
    // the whole interaction, but assert it took rather than trusting fill.
    await expect(this.quantity).toHaveValue(String(value));
  }
}
