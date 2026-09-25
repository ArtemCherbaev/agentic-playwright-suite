import { test, expect } from '@fixtures/api';
import { Products, SearchTerm } from '@utils/testData';

/**
 * The catalogue endpoints.
 *
 * Every case asserts the HTTP status as well as the body's own code, although
 * the HTTP status is always 200 here (AE-6). Pinning it means the day the API
 * starts answering with real status codes, these cases say so instead of
 * carrying on as if nothing changed.
 */
test.describe('Catalogue API', { tag: ['@api', '@catalogue'] }, () => {
  test('API-01 the product list returns the whole catalogue, each product complete', async ({
    api,
  }) => {
    const { http, body } = await api.productsList();

    expect(http).toBe(200);
    expect(body.responseCode).toBe(200);
    expect(body.products.length).toBeGreaterThan(0);

    for (const product of body.products) {
      expect(product, `product ${product.id}`).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.stringMatching(/^Rs\. \d+$/),
        brand: expect.any(String),
        category: { usertype: { usertype: expect.any(String) }, category: expect.any(String) },
      });
    }

    const ids = body.products.map((p) => p.id);
    expect(new Set(ids).size, 'product ids are unique').toBe(ids.length);

    // The same product the functional suite puts in a cart, by id, so the two
    // suites are known to be talking about one catalogue.
    expect(body.products.find((p) => p.id === Products.blueTop.id)).toMatchObject({
      name: Products.blueTop.name,
      price: Products.blueTop.price,
    });
  });

  test('API-02 the product list refuses a POST with 405 in the body', async ({ api }) => {
    const { http, body } = await api.send('POST', 'productsList');

    expect(http).toBe(200);
    expect(body).toEqual({ responseCode: 405, message: 'This request method is not supported.' });
  });

  test('API-03 every brand a product carries is in the brand list', async ({ api }) => {
    const [brands, products] = await Promise.all([api.brandsList(), api.productsList()]);

    expect(brands.http).toBe(200);
    expect(brands.body.responseCode).toBe(200);

    const listed = new Set(brands.body.brands.map((b) => b.brand));
    const carried = new Set(products.body.products.map((p) => p.brand));
    expect([...carried].filter((brand) => !listed.has(brand))).toEqual([]);

    // The list has one row per product rather than one per brand (AE-8), so it
    // is asserted as a set. The row count is recorded, not relied on.
    test.info().annotations.push({
      type: 'observation',
      description: `${brands.body.brands.length} rows, ${listed.size} distinct brands`,
    });
  });

  test('API-04 the brand list refuses a PUT with 405 in the body', async ({ api }) => {
    const { http, body } = await api.send('PUT', 'brandsList');

    expect(http).toBe(200);
    expect(body).toEqual({ responseCode: 405, message: 'This request method is not supported.' });
  });

  test('API-05 a search narrows the catalogue and returns what it matched', async ({ api }) => {
    const [all, found] = await Promise.all([
      api.productsList(),
      api.searchProducts(SearchTerm.broad),
    ]);

    expect(found.http).toBe(200);
    expect(found.body.responseCode).toBe(200);
    expect(found.body.products.length).toBeGreaterThan(0);
    expect(found.body.products.length).toBeLessThan(all.body.products.length);

    // Search matches the category as well as the name (AE-2), so a result
    // must mention the term in one or the other.
    const term = SearchTerm.broad.toLowerCase();
    for (const product of found.body.products) {
      const haystack = `${product.name} ${product.category.category}`.toLowerCase();
      expect(haystack, `product ${product.id}`).toContain(term);
    }
  });

  test('API-06 a search without a term is refused with 400 in the body', async ({ api }) => {
    const { http, body } = await api.searchProducts();

    expect(http).toBe(200);
    expect(body).toEqual({
      responseCode: 400,
      message: 'Bad request, search_product parameter is missing in POST request.',
    });
  });
});
