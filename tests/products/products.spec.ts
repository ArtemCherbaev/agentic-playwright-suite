import { test, expect } from '@fixtures/test';
import { Products, SearchTerm } from '@utils/testData';

test.describe('Catalogue', { tag: ['@functional', '@products'] }, () => {
  test('TC-08 the products page lists the catalogue', async ({ products }) => {
    await products.open();

    await expect(products.sectionTitle).toHaveText(/all products/i);
    expect(await products.items.count()).toBeGreaterThan(20);
    await expect(products.itemName(0)).not.toBeEmpty();
  });

  test('TC-09 a product page states everything a buyer decides on', async ({ details }) => {
    await details.open(Products.blueTop.id);

    await expect(details.name).toHaveText(Products.blueTop.name);
    await expect(details.price).toContainText(Products.blueTop.price);
    await expect(details.category).toContainText('Women');
    await expect(details.availability).toContainText('In Stock');
    await expect(details.condition).toContainText('New');
    await expect(details.brand).toContainText(/\w/);
  });

  test('TC-10 search narrows the catalogue rather than returning all of it', async ({
    products,
  }) => {
    await products.open();
    const catalogue = await products.items.count();

    await products.search(SearchTerm.broad);
    const results = await products.items.count();

    expect(results).toBeGreaterThan(0);
    // The assertion that matters. A search returning everything passes any
    // "results are not empty" check and is still broken.
    expect(results).toBeLessThan(catalogue);

    // The search matches the category as well as the name, so not every result
    // contains the term: searching "top" returns "Colour Blocked Shirt" because
    // it sits under Tops. That is the application's behaviour, recorded in
    // specs/STATUS.md, so the case asserts what is true rather than what would
    // be tidier: the obvious match is present, and nothing came back blank.
    const names = await Promise.all(Array.from({ length: results }, (_, i) => products.nameOf(i)));
    expect(names.some((name) => name.toLowerCase().includes(SearchTerm.broad))).toBe(true);
    expect(names.every((name) => name.length > 0)).toBe(true);
  });

  test('TC-11 a search that matches nothing says so rather than showing everything', async ({
    products,
  }) => {
    await products.open();
    await products.search(SearchTerm.none);

    await expect(products.items).toHaveCount(0);
  });

  test('TC-12 a category narrows the catalogue to that category', async ({ products, page }) => {
    await products.open();

    await products.openCategory('Women', 'Dress');

    await expect(page).toHaveURL(/category_products/);
    await expect(products.sectionTitle).toContainText(/women\s*-\s*dress/i);
    expect(await products.items.count()).toBeGreaterThan(0);
  });

  test('TC-13 a brand narrows the catalogue to that brand', async ({ products, page }) => {
    await products.open();

    const polo = products.brandLink('Polo');
    await expect(polo).toBeVisible();
    await polo.click();

    await expect(page).toHaveURL(/brand_products\/Polo/);
    await expect(products.sectionTitle).toContainText(/polo/i);
    expect(await products.items.count()).toBeGreaterThan(0);
  });
});
