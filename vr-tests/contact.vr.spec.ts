import { test, expect } from '@fixtures/test';
import { contactMessage } from '@utils/testData';
import { adMasks, readyForCapture } from '@utils/visual';

test.describe('Visual: contact', { tag: ['@visual', '@contact'] }, () => {
  test('VR-19 the contact form', async ({ contact, page }) => {
    await contact.open();
    await readyForCapture(page);

    // The page carries two elements with the class .contact-form, a section and a
    // row inside it, so the class alone is ambiguous. The form itself is the
    // component this case is about.
    await expect(page.locator('.contact-form form')).toHaveScreenshot('contact-form.png', {
      mask: adMasks(page),
    });
  });

  test('VR-20 the contact success state', async ({ contact, page }) => {
    await contact.open();
    await contact.submitForm(contactMessage());
    await expect(contact.success).toBeVisible();
    await readyForCapture(page);

    await expect(page.locator('#contact-page .status')).toHaveScreenshot('contact-success.png');
  });
});
