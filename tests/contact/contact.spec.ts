import { test, expect } from '@fixtures/test';
import { contactMessage, Products } from '@utils/testData';

test.describe('Contact and reviews', { tag: ['@functional', '@contact'] }, () => {
  test('TC-18 the contact form submits and confirms', async ({ contact }) => {
    const fields = contactMessage();

    await contact.open();
    await expect(contact.heading).toBeVisible();

    await contact.submitForm(fields);

    await expect(contact.success).toBeVisible();
  });

  test('TC-19 a review can be left against a product', async ({ details }) => {
    const { name, email, message } = contactMessage();

    await details.open(Products.blueTop.id);

    await details.reviewName.fill(name);
    await details.reviewEmail.fill(email);
    await details.reviewText.fill(message);
    await details.reviewSubmit.click();

    await expect(details.reviewSuccess).toBeVisible();
  });
});
