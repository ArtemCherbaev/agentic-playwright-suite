import { test as base, expect } from '@playwright/test';
import { AutomationExerciseApi } from '../api/AutomationExerciseApi.js';
import { newUser, type NewUser } from '../testData.js';

/**
 * Fixtures for the API suite.
 *
 * No browser is started: `request` is Playwright's HTTP client, so an API case
 * costs a network round trip and nothing else. The account fixture creates its
 * account over the API and deletes it again in teardown, whether the case
 * passed or not, for the same reason the functional suite does: the target is a
 * shared database.
 */

interface ApiFixtures {
  api: AutomationExerciseApi;
  /** An account that exists for the duration of one case. */
  apiAccount: NewUser;
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new AutomationExerciseApi(request));
  },

  apiAccount: async ({ api }, use) => {
    const user = newUser();
    const created = await api.createAccount(user);
    if (created.body.responseCode !== 201) {
      throw new Error(`could not create ${user.email}: ${JSON.stringify(created.body)}`);
    }

    await use(user);

    // A case may already have deleted it; that is a 404 here, not a failure.
    const deleted = await api.deleteAccount(user.email, user.password);
    if (![200, 404].includes(deleted.body.responseCode)) {
      console.warn(`could not delete ${user.email}: ${JSON.stringify(deleted.body)}`);
    }
  },
});

export { expect };
