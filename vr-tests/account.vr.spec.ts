import { test, expect } from '@fixtures/test';
import { newUser } from '@utils/testData';
import { adMasks, readyForCapture } from '@utils/visual';

test.describe('Visual: account', { tag: ['@visual', '@auth'] }, () => {
  test('VR-15 the login form', async ({ auth, page }) => {
    await auth.open();
    await readyForCapture(page);

    await expect(page.locator('.login-form')).toHaveScreenshot('login-form.png', {
      mask: adMasks(page),
    });
  });

  test('VR-16 the signup form', async ({ auth, page }) => {
    await auth.open();
    await readyForCapture(page);

    await expect(page.locator('.signup-form')).toHaveScreenshot('signup-form.png', {
      mask: adMasks(page),
    });
  });

  test('VR-17 the login error state', async ({ auth, page }) => {
    await auth.open();
    await auth.login('nobody@example.invalid', 'wrong-password');
    await expect(auth.loginError).toBeVisible();
    await readyForCapture(page);

    await expect(page.locator('.login-form')).toHaveScreenshot('login-form-error.png', {
      mask: adMasks(page),
    });
  });

  test('VR-18 the account details form', async ({ auth, page }) => {
    const user = newUser();

    await auth.open();
    await auth.startSignup(user.name, user.email);
    await expect(auth.detailsHeading).toBeVisible();
    await readyForCapture(page);

    // The first block only. The address block below it is a second capture's
    // worth of form and would make this baseline tall enough that any change
    // anywhere in it lands on one picture.
    await expect(page.locator('.login-form form > div').first()).toHaveScreenshot(
      'account-details.png',
      { mask: adMasks(page) },
    );
  });
});
