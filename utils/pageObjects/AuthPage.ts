import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { Path, Title } from '../url.js';
import type { NewUser } from '../testData.js';

/**
 * Signup and login, which share one page, and the account details form that
 * follows a signup.
 *
 * The form controls here carry data-qa attributes the application put there for
 * exactly this purpose, so this is the one page object that leans on
 * getByTestId rather than on roles. testIdAttribute is set to data-qa in the
 * Playwright config.
 */
export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ---------- login ----------

  get loginHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Login to your account' });
  }

  get loginEmail(): Locator {
    return this.page.getByTestId('login-email');
  }

  get loginPassword(): Locator {
    return this.page.getByTestId('login-password');
  }

  get loginButton(): Locator {
    return this.page.getByTestId('login-button');
  }

  get loginError(): Locator {
    return this.page.getByText('Your email or password is incorrect!');
  }

  // ---------- signup ----------

  get signupHeading(): Locator {
    return this.page.getByRole('heading', { name: 'New User Signup!' });
  }

  get signupName(): Locator {
    return this.page.getByTestId('signup-name');
  }

  get signupEmail(): Locator {
    return this.page.getByTestId('signup-email');
  }

  get signupButton(): Locator {
    return this.page.getByTestId('signup-button');
  }

  get signupError(): Locator {
    return this.page.getByText('Email Address already exist!');
  }

  // ---------- account details, the page after signup ----------

  get detailsHeading(): Locator {
    return this.page.getByText('Enter Account Information');
  }

  get titleMr(): Locator {
    return this.page.locator('#id_gender1');
  }

  get password(): Locator {
    return this.page.locator('#password');
  }

  get days(): Locator {
    return this.page.locator('#days');
  }

  get months(): Locator {
    return this.page.locator('#months');
  }

  get years(): Locator {
    return this.page.locator('#years');
  }

  get newsletter(): Locator {
    return this.page.locator('#newsletter');
  }

  get createAccountButton(): Locator {
    return this.page.getByTestId('create-account');
  }

  get accountCreated(): Locator {
    return this.page.getByTestId('account-created');
  }

  get continueAfterCreate(): Locator {
    return this.page.getByTestId('continue-button');
  }

  get accountDeleted(): Locator {
    return this.page.getByTestId('account-deleted');
  }

  async open(): Promise<void> {
    await this.goto(Path.login);
    await expect(this.page).toHaveTitle(Title.login);
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginButton.click();
  }

  async startSignup(name: string, email: string): Promise<void> {
    await this.signupName.fill(name);
    await this.signupEmail.fill(email);
    await this.signupButton.click();
  }

  /** Fill the account details form and submit it. */
  async completeSignup(user: NewUser): Promise<void> {
    await expect(this.detailsHeading).toBeVisible();

    await this.titleMr.check();
    await this.password.fill(user.password);
    await this.days.selectOption(user.day);
    await this.months.selectOption(user.month);
    await this.years.selectOption(user.year);
    await this.newsletter.check();

    await this.page.getByTestId('first_name').fill(user.firstName);
    await this.page.getByTestId('last_name').fill(user.lastName);
    await this.page.getByTestId('company').fill(user.company);
    await this.page.getByTestId('address').fill(user.address);
    await this.page.getByTestId('address2').fill(user.address2);
    await this.page.getByTestId('country').selectOption(user.country);
    await this.page.getByTestId('state').fill(user.state);
    await this.page.getByTestId('city').fill(user.city);
    await this.page.getByTestId('zipcode').fill(user.zipcode);
    await this.page.getByTestId('mobile_number').fill(user.mobile);

    await this.createAccountButton.click();
    await expect(this.accountCreated).toBeVisible();
  }

  /** Signup and account details in one call, for cases whose subject is not signup. */
  async register(user: NewUser): Promise<void> {
    await this.open();
    await this.startSignup(user.name, user.email);
    await this.completeSignup(user);
    await this.continueAfterCreate.click();
    await expect(this.loggedInAs).toContainText(user.name);
  }

  /**
   * Delete the account this run created. Called from a fixture teardown rather
   * than from the test body, so an account is removed even when the case it
   * belonged to failed halfway through.
   */
  async deleteAccount(): Promise<void> {
    await this.deleteAccountLink.click();
    await expect(this.accountDeleted).toBeVisible();
    await this.continueAfterCreate.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
    await this.page.waitForURL(`**${Path.login}`);
  }
}
