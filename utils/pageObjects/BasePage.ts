import { type Locator, type Page } from '@playwright/test';
import { Path } from '../url.js';

/**
 * What every page on the target shares: the header, the footer subscription
 * box, and the advertising that sits between them.
 *
 * Locator policy for the whole suite, enforced by the locator-auditor agent and
 * written down in docs/architecture.md:
 *
 *   1. getByRole with an accessible name, wherever the markup allows it.
 *   2. data-qa, which this application sets on its form controls.
 *   3. A stable id the application clearly owns.
 *   4. A CSS class, only with a comment saying why the three above failed.
 *
 * XPath and nth-child are not on the list. Both encode the shape of the
 * document rather than the thing a user is looking for, and both break on a
 * change that a person reading the page would not even notice.
 */
export abstract class BasePage {
  protected constructor(readonly page: Page) {}

  // ---------- header ----------

  get homeLink(): Locator {
    return this.page.getByRole('link', { name: 'Home', exact: true });
  }

  get productsLink(): Locator {
    return this.page.getByRole('link', { name: 'Products', exact: true });
  }

  get cartLink(): Locator {
    return this.page.locator('.navbar-nav').getByRole('link', { name: 'Cart' });
  }

  get signupLoginLink(): Locator {
    return this.page.getByRole('link', { name: 'Signup / Login' });
  }

  get logoutLink(): Locator {
    return this.page.getByRole('link', { name: 'Logout' });
  }

  get deleteAccountLink(): Locator {
    return this.page.getByRole('link', { name: 'Delete Account' });
  }

  get contactUsLink(): Locator {
    return this.page.getByRole('link', { name: 'Contact us' });
  }

  /** "Logged in as <name>" — the only signal in the header that a session exists. */
  get loggedInAs(): Locator {
    return this.page.locator('.navbar-nav').getByText('Logged in as');
  }

  // ---------- footer subscription ----------

  get subscribeEmail(): Locator {
    // The application's own id, misspelling and all. Correcting it here would
    // produce a locator that matches nothing.
    return this.page.locator('#susbscribe_email');
  }

  get subscribeButton(): Locator {
    return this.page.locator('#subscribe');
  }

  get subscribeSuccess(): Locator {
    return this.page.getByText('You have been successfully subscribed!');
  }

  // ---------- shared behaviour ----------

  /**
   * Third party advertising is injected into every page and is the single
   * largest source of movement on it. Ads are masked out of screenshots rather
   * than blocked, because blocking them would change the layout the visual
   * baselines were taken of.
   */
  get adFrames(): Locator {
    return this.page.locator('iframe[id^="google_ads"], iframe[name^="aswift"], .adsbygoogle');
  }

  /**
   * The consent dialog appears on a first visit from a new context and covers
   * the page. It is dismissed rather than waited for: it is not always shown,
   * and a test that waits for something optional is a test that fails on the
   * runs where the application behaved better.
   */
  async dismissConsent(): Promise<void> {
    const consent = this.page.getByRole('button', { name: /^(Consent|Accept|I agree)/i }).first();
    if (await consent.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await consent.click().catch(() => undefined);
    }
  }

  /**
   * Close Google's vignette interstitial if it has taken over the page.
   *
   * It opens over the whole page on a navigation and leaves the address as
   * `...#google_vignette` rather than the page that was asked for. Going back
   * returns to where the visitor was, and the action that triggered it can then
   * be repeated. Returns whether one was found, so a caller can say in its
   * report that it met one.
   */
  async dismissVignette(): Promise<boolean> {
    if (!this.page.url().includes('#google_vignette')) return false;
    await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    return true;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.dismissVignette();
    await this.dismissConsent();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
    await this.page.waitForURL(`**${Path.cart}`);
  }

  /**
   * Fills the box and submits it, and says nothing about the outcome. Page
   * objects here act; the case that called this is the one that decides what
   * success looks like and asserts it. A helper that asserts on its own leaves
   * cases that appear to check nothing at all.
   */
  async subscribe(email: string): Promise<void> {
    await this.subscribeEmail.fill(email);
    await this.subscribeButton.click();
  }

  /**
   * Freeze everything that moves without being asked to: the carousel, the
   * scroll animations, and any CSS transition mid-flight. Used by the visual
   * suite, and by any functional case that has to look at the hero.
   */
  async settle(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        .carousel-inner .item { transition: none !important; }
      `,
    });
    await this.page.waitForLoadState('load').catch(() => undefined);
  }
}
