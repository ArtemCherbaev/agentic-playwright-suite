import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pageObjects/HomePage.js';
import { ProductsPage } from '../pageObjects/ProductsPage.js';
import { ProductDetailsPage } from '../pageObjects/ProductDetailsPage.js';
import { CartPage } from '../pageObjects/CartPage.js';
import { AuthPage } from '../pageObjects/AuthPage.js';
import { ContactPage } from '../pageObjects/ContactPage.js';
import { newUser, type NewUser } from '../testData.js';
import { pinTypefaces } from '../visual.js';
import { HostOutageRecorder } from '../outage.js';

/**
 * The fixtures every case is written against.
 *
 * Page objects are fixtures rather than constructed in the test body, so a case
 * reads as the thing it is checking and not as its own setup. The account
 * fixture also owns teardown: the account it creates is deleted whether the
 * case passed or failed, because a suite that leaves rubbish in a shared
 * database poisons the runs after it.
 */

interface Pages {
  home: HomePage;
  products: ProductsPage;
  details: ProductDetailsPage;
  cart: CartPage;
  auth: AuthPage;
  contact: ContactPage;
}

interface Accounts {
  /** A registered, logged in account, removed again in teardown. */
  account: NewUser;
}

interface Capture {
  /** Visual project only: the typeface a capture is in is the application's own. */
  pinnedTypefaces: void;
  /** Every case: a failure while the host answered 5xx is labelled as such. */
  hostOutage: void;
}

export const test = base.extend<Pages & Accounts & Capture>({
  // Auto, and depending only on the context, so it is set up before the account
  // fixture registers and torn down after it deletes: a host that is down during
  // either is caught as well as one that is down during the case itself.
  hostOutage: [
    async ({ context, baseURL }, use, testInfo) => {
      const recorder = new HostOutageRecorder(context, new URL(baseURL!).hostname);
      await use();
      const outage = await recorder.verdict(testInfo);
      if (outage) throw outage;
    },
    { auto: true },
  ],

  pinnedTypefaces: [
    async ({ page }, use, testInfo) => {
      if (testInfo.project.name === 'visual') await pinTypefaces(page);
      await use();
    },
    { auto: true },
  ],

  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  products: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  details: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  auth: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  contact: async ({ page }, use) => {
    await use(new ContactPage(page));
  },

  account: async ({ auth }, use) => {
    const user = newUser();
    await auth.register(user);

    await use(user);

    // Teardown runs after a failure too. If the browser is already gone there
    // is nothing to clean up and nothing worth failing the run over, so the
    // deletion is attempted and its failure recorded rather than thrown.
    try {
      await auth.deleteAccount();
    } catch (error) {
      console.warn(`could not delete ${user.email}: ${(error as Error).message}`);
    }
  },
});

export { expect };
