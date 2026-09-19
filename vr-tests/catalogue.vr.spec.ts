import { test, expect } from '@fixtures/test';
import { Products, SearchTerm } from '@utils/testData';
import { adMasks, readyForCapture } from '@utils/visual';

test.describe('Visual: catalogue', { tag: ['@visual', '@products'] }, () => {
  test('VR-06 the products page header and search', async ({ products, page }) => {
    await products.open();
    await readyForCapture(page);

    // The application gives the search control no wrapper of its own, so the input and
    // its button are captured as the two components they are.
    await expect(page.locator('#search_product')).toHaveScreenshot('search-input.png');
    await expect(page.locator('#submit_search')).toHaveScreenshot('search-button.png');
  });

  test('VR-07 search results heading and first tile', async ({ products, page }) => {
    await products.open();
    await products.search(SearchTerm.broad);
    await readyForCapture(page);

    await expect(products.sectionTitle).toHaveScreenshot('searched-title.png');
    await expect(products.items.first()).toHaveScreenshot('search-result-tile.png', {
      mask: adMasks(page),
    });
  });

  test('VR-08 the product information panel', async ({ details, page }) => {
    await details.open(Products.blueTop.id);
    await readyForCapture(page);

    await expect(details.information).toHaveScreenshot('product-information.png', {
      mask: adMasks(page),
    });
  });

  test('VR-09 the review form', async ({ details, page }) => {
    await details.open(Products.blueTop.id);
    await readyForCapture(page);

    await expect(page.locator('#review-form')).toHaveScreenshot('review-form.png', {
      mask: adMasks(page),
    });
  });

  test('VR-10 a category listing', async ({ products, page }) => {
    await products.open();
    await products.openCategory('Women', 'Dress');
    await readyForCapture(page);

    await expect(products.sectionTitle).toHaveScreenshot('category-title.png');
    await expect(products.items.first()).toHaveScreenshot('category-tile.png', {
      mask: adMasks(page),
    });
  });
});
