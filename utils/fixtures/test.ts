import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pageObjects/HomePage.js';
import { ProductsPage } from '../pageObjects/ProductsPage.js';
import { ProductDetailsPage } from '../pageObjects/ProductDetailsPage.js';
import { CartPage } from '../pageObjects/CartPage.js';
import { AuthPage } from '../pageObjects/AuthPage.js';
import { ContactPage } from '../pageObjects/ContactPage.js';
import { newUser, type NewUser } from '../testData.js';

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

export const test = base.extend<Pages & Accounts>({
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
