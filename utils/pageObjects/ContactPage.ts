import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { Path, Title } from '../url.js';

export class ContactPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Get In Touch' });
  }

  get name(): Locator {
    return this.page.getByTestId('name');
  }

  get email(): Locator {
    return this.page.getByTestId('email');
  }

  get subject(): Locator {
    return this.page.getByTestId('subject');
  }

  get message(): Locator {
    return this.page.getByTestId('message');
  }

  get upload(): Locator {
    return this.page.locator('input[name="upload_file"]');
  }

  get submit(): Locator {
    return this.page.getByTestId('submit-button');
  }

  /**
   * The footer subscription box uses the same success wording as this form, so
   * an unscoped match resolves to two elements and the assertion fails in
   * strict mode. Scoping to the contact page also means a green tick here
   * cannot be produced by the wrong banner.
   */
  get success(): Locator {
    return this.page
      .locator('#contact-page')
      .getByText('Success! Your details have been submitted successfully.');
  }

  get backHome(): Locator {
    return this.page.getByRole('link', { name: /Home/ }).last();
  }

  async open(): Promise<void> {
    await this.goto(Path.contact);
    await expect(this.page).toHaveTitle(Title.contact);
  }

  /**
   * Submitting raises a native confirm dialog. Playwright dismisses dialogs by
   * default, which would cancel the submission and leave the case asserting on
   * a success banner that was never going to appear. The handler is registered
   * before the click, not after.
   */
  async submitForm(fields: { name: string; email: string; subject: string; message: string }) {
    await this.name.fill(fields.name);
    await this.email.fill(fields.email);
    await this.subject.fill(fields.subject);
    await this.message.fill(fields.message);

    this.page.once('dialog', (dialog) => void dialog.accept());
    await this.submit.click();
    await expect(this.success).toBeVisible();
  }
}
