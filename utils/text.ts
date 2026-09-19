import { expect, type Locator } from '@playwright/test';

/**
 * Read a product name that an advertiser has been writing into.
 *
 * The target carries Google's link annotations, which decorate words inside the
 * product title with their own markup. Two shapes have been observed on the
 * same page within a minute of each other:
 *
 *   <p>Full Sleeves Top Cherry - Pink<span class="google-anno-t">Apparel</span></p>
 *   <p><a class="google-anno"><span class="google-anno-t">Lace Top For Women</span></a></p>
 *
 * Plain `textContent` picks up the advertiser's word in the first shape, and
 * keeping only direct text nodes returns an empty string in the second. An
 * empty name is the worse failure of the two: it is passed to a `hasText`
 * filter, matches every row in the cart, and the case fails several assertions
 * later with a count that makes no sense.
 *
 * Removing the annotation elements and then reading the text handles both, and
 * the result is asserted non-empty so the next shape of this problem fails here
 * with a clear message rather than downstream with a confusing one.
 */
export async function productName(nameLocator: Locator): Promise<string> {
  const name = await nameLocator.evaluate((el) => {
    const clean = (node: HTMLElement) => (node.textContent ?? '').replace(/\s+/g, ' ').trim();

    const copy = el.cloneNode(true) as HTMLElement;
    const full = clean(copy);

    copy.querySelectorAll('.google-anno, .google-anno-t, ins, iframe').forEach((n) => n.remove());
    const stripped = clean(copy);

    // Stripping everything means the annotation wrapped the whole title rather
    // than appending to it. The full text is then the better answer of the two,
    // and an empty string is never the right one.
    return stripped || full;
  });

  expect(name, 'product name read from the tile should not be empty').not.toBe('');
  return name;
}
