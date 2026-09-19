import { test, expect } from '@fixtures/test';
import { newUser } from '@utils/testData';

/**
 * Registration and login.
 *
 * Every case that creates an account deletes it, including the ones that are
 * about failure. The target is a shared database and this suite runs on every
 * push; an account left behind would still be there in a year.
 */
test.describe('Account', { tag: ['@functional', '@auth'] }, () => {
  test('TC-04 a new visitor can register and is greeted by name', async ({ auth }) => {
    const user = newUser();

    await auth.open();
    await expect(auth.signupHeading).toBeVisible();

    await auth.startSignup(user.name, user.email);
    await auth.completeSignup(user);

    await expect(auth.accountCreated).toBeVisible();
    await auth.continueAfterCreate.click();
    await expect(auth.loggedInAs).toContainText(user.name);

    await auth.deleteAccount();
  });

  test('TC-05 the wrong password is refused and no session is created', async ({
    account,
    auth,
  }) => {
    // The account fixture leaves us logged in; this case is about the front
    // door, so close the session first.
    await auth.logout();

    await auth.login(account.email, 'not-the-password');

    await expect(auth.loginError).toBeVisible();
    await expect(auth.loggedInAs).toHaveCount(0);

    // Log back in so the fixture can delete the account it created.
    await auth.login(account.email, account.password);
    await expect(auth.loggedInAs).toContainText(account.name);
  });

  test('TC-06 an existing account can log in and log out again', async ({ account, auth }) => {
    await auth.logout();
    await expect(auth.loginHeading).toBeVisible();

    await auth.login(account.email, account.password);
    await expect(auth.loggedInAs).toContainText(account.name);

    await auth.logout();
    await expect(auth.signupLoginLink).toBeVisible();
    await expect(auth.loggedInAs).toHaveCount(0);

    // Back in, so teardown can remove the account.
    await auth.login(account.email, account.password);
  });

  test('TC-07 registering an email that already exists is refused', async ({ account, auth }) => {
    await auth.logout();

    await auth.startSignup('Someone Else', account.email);

    await expect(auth.signupError).toBeVisible();
    // The refusal must not have half created anything: the details form is the
    // step that would follow a successful signup.
    await expect(auth.detailsHeading).toHaveCount(0);

    await auth.login(account.email, account.password);
  });
});
