# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vr-tests/catalogue.vr.spec.ts >> Visual: catalogue >> VR-10 a category listing
- Location: vr-tests/catalogue.vr.spec.ts:45:3

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('.features_items .title')
  Expected an image 833px by 23px, received 833px by 20px. 1374 pixels (ratio 0.08 of all image pixels) are different.

  Snapshot: category-title.png

Call log:
  - Expect "toHaveScreenshot(category-title.png)" locator('.features_items .title') with timeout 10000ms
    - verifying given screenshot expectation
  - waiting for locator('.features_items .title')
    - locator resolved to <h2 class="title text-center">Women - Dress Products</h2>
  - taking element screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - attempting scroll into view action
    - waiting for element to be stable
  - Expected an image 833px by 23px, received 833px by 20px. 1374 pixels (ratio 0.08 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - waiting for locator('.features_items .title')
    - locator resolved to <h2 class="title text-center">Women - Dress Products</h2>
  - taking element screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - attempting scroll into view action
    - waiting for element to be stable
  - captured a stable screenshot
  - Expected an image 833px by 23px, received 833px by 20px. 1374 pixels (ratio 0.08 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [active] [ref=f16e1]:
  - banner [ref=f16e2]:
    - generic [ref=f16e5]:
      - link [ref=f16e8] [cursor=pointer]:
        - /url: /
        - img "Website for automation practice" [ref=f16e9]
      - list [ref=f16e12]:
        - listitem [ref=f16e13]:
          - link " Home" [ref=f16e14] [cursor=pointer]:
            - /url: /
            - generic [ref=f16e15]: 
            - text: Home
        - listitem [ref=f16e16]:
          - link " Products" [ref=f16e17] [cursor=pointer]:
            - /url: /products
            - generic [ref=f16e18]: 
            - text: Products
        - listitem [ref=f16e19]:
          - link " Cart" [ref=f16e20] [cursor=pointer]:
            - /url: /view_cart
            - generic [ref=f16e21]: 
            - text: Cart
        - listitem [ref=f16e22]:
          - link " Signup / Login" [ref=f16e23] [cursor=pointer]:
            - /url: /login
            - generic [ref=f16e24]: 
            - text: Signup / Login
        - listitem [ref=f16e25]:
          - link " Test Cases" [ref=f16e26] [cursor=pointer]:
            - /url: /test_cases
            - generic [ref=f16e27]: 
            - text: Test Cases
        - listitem [ref=f16e28]:
          - link " API Testing" [ref=f16e29] [cursor=pointer]:
            - /url: /api_list
            - generic [ref=f16e30]: 
            - text: API Testing
        - listitem [ref=f16e31]:
          - link " Video Tutorials" [ref=f16e32] [cursor=pointer]:
            - /url: https://www.youtube.com/c/AutomationExercise
            - generic [ref=f16e33]: 
            - text: Video Tutorials
        - listitem [ref=f16e34]:
          - link " Contact us" [ref=f16e35] [cursor=pointer]:
            - /url: /contact_us
            - generic [ref=f16e36]: 
            - text: Contact us
  - generic [ref=f16e38]:
    - list [ref=f16e40]:
      - listitem [ref=f16e41]:
        - link "Products" [ref=f16e42] [cursor=pointer]:
          - /url: /products
      - listitem [ref=f16e43]: Women > Dress
    - generic [ref=f16e44]:
      - generic [ref=f16e46]:
        - heading "Category" [level=2] [ref=f16e47]
        - generic [ref=f16e48]:
          - heading [level=4] [ref=f16e51]:
            - link " Women" [ref=f16e52] [cursor=pointer]:
              - /url: "#Women"
              - generic [ref=f16e53]: 
              - text: Women
          - heading [level=4] [ref=f16e57]:
            - link " Men" [ref=f16e58] [cursor=pointer]:
              - /url: "#Men"
              - generic [ref=f16e59]: 
              - text: Men
          - heading [level=4] [ref=f16e63]:
            - link " Kids" [ref=f16e64] [cursor=pointer]:
              - /url: "#Kids"
              - generic [ref=f16e65]: 
              - text: Kids
        - generic [ref=f16e67]:
          - heading "Brands" [level=2] [ref=f16e68]
          - list [ref=f16e70]:
            - listitem [ref=f16e71]:
              - link "(6) Polo" [ref=f16e72] [cursor=pointer]:
                - /url: /brand_products/Polo
                - generic [ref=f16e73]: (6)
                - text: Polo
            - listitem [ref=f16e74]:
              - link "(5) H&M" [ref=f16e75] [cursor=pointer]:
                - /url: /brand_products/H&M
                - generic [ref=f16e76]: (5)
                - text: H&M
            - listitem [ref=f16e77]:
              - link "(5) Madame" [ref=f16e78] [cursor=pointer]:
                - /url: /brand_products/Madame
                - generic [ref=f16e79]: (5)
                - text: Madame
            - listitem [ref=f16e80]:
              - link "(3) Mast & Harbour" [ref=f16e81] [cursor=pointer]:
                - /url: /brand_products/Mast & Harbour
                - generic [ref=f16e82]: (3)
                - text: Mast & Harbour
            - listitem [ref=f16e83]:
              - link "(4) Babyhug" [ref=f16e84] [cursor=pointer]:
                - /url: /brand_products/Babyhug
                - generic [ref=f16e85]: (4)
                - text: Babyhug
            - listitem [ref=f16e86]:
              - link "(3) Allen Solly Junior" [ref=f16e87] [cursor=pointer]:
                - /url: /brand_products/Allen Solly Junior
                - generic [ref=f16e88]: (3)
                - text: Allen Solly Junior
            - listitem [ref=f16e89]:
              - link "(3) Kookie Kids" [ref=f16e90] [cursor=pointer]:
                - /url: /brand_products/Kookie Kids
                - generic [ref=f16e91]: (3)
                - text: Kookie Kids
            - listitem [ref=f16e92]:
              - link "(5) Biba" [ref=f16e93] [cursor=pointer]:
                - /url: /brand_products/Biba
                - generic [ref=f16e94]: (5)
                - text: Biba
      - generic [ref=f16e96]:
        - heading "Women - Dress Products" [level=2] [ref=f16e97]
        - generic [ref=f16e99]:
          - generic [ref=f16e100]:
            - generic [ref=f16e101]:
              - img "ecommerce website products" [ref=f16e102]
              - heading "Rs. 1000" [level=2] [ref=f16e103]
              - paragraph [ref=f16e104]: Sleeveless Dress
              - link " Add to cart" [ref=f16e105] [cursor=pointer]:
                - /url: javascript:void();
                - generic [ref=f16e106]: 
                - text: Add to cart
            - generic [ref=f16e107]:
              - heading "Rs. 1000" [level=2] [ref=f16e108]
              - paragraph [ref=f16e109]: Sleeveless Dress
              - link " Add to cart" [ref=f16e110] [cursor=pointer]:
                - /url: javascript:void();
                - generic [ref=f16e111]: 
                - text: Add to cart
          - list [ref=f16e113]:
            - listitem [ref=f16e114]:
              - link " View Product" [ref=f16e115] [cursor=pointer]:
                - /url: /product_details/3
                - generic [ref=f16e116]: 
                - text: View Product
        - generic [ref=f16e118]:
          - generic [ref=f16e119]:
            - generic [ref=f16e120]:
              - img "ecommerce website products" [ref=f16e121]
              - heading "Rs. 1500" [level=2] [ref=f16e122]
              - paragraph [ref=f16e123]: Stylish Dress
              - link " Add to cart" [ref=f16e124] [cursor=pointer]:
                - /url: javascript:void();
                - generic [ref=f16e125]: 
                - text: Add to cart
            - generic [ref=f16e126]:
              - heading "Rs. 1500" [level=2] [ref=f16e127]
              - paragraph [ref=f16e128]: Stylish Dress
              - link " Add to cart" [ref=f16e129] [cursor=pointer]:
                - /url: javascript:void();
                - generic [ref=f16e130]: 
                - text: Add to cart
          - list [ref=f16e132]:
            - listitem [ref=f16e133]:
              - link " View Product" [ref=f16e134] [cursor=pointer]:
                - /url: /product_details/4
                - generic [ref=f16e135]: 
                - text: View Product
        - generic [ref=f16e137]:
          - generic [ref=f16e138]:
            - generic [ref=f16e139]:
              - img "ecommerce website products" [ref=f16e140]
              - heading "Rs. 2300" [level=2] [ref=f16e141]
              - paragraph [ref=f16e142]: Rose Pink Embroidered Maxi Dress
              - link " Add to cart" [ref=f16e143] [cursor=pointer]:
                - /url: javascript:void();
                - generic [ref=f16e144]: 
                - text: Add to cart
            - generic [ref=f16e145]:
              - heading "Rs. 2300" [level=2] [ref=f16e146]
              - paragraph [ref=f16e147]: Rose Pink Embroidered Maxi Dress
              - link " Add to cart" [ref=f16e148] [cursor=pointer]:
                - /url: javascript:void();
                - generic [ref=f16e149]: 
                - text: Add to cart
          - list [ref=f16e151]:
            - listitem [ref=f16e152]:
              - link " View Product" [ref=f16e153] [cursor=pointer]:
                - /url: /product_details/38
                - generic [ref=f16e154]: 
                - text: View Product
  - contentinfo [ref=f16e155]:
    - generic [ref=f16e160]:
      - heading "Subscription" [level=2] [ref=f16e161]
      - generic [ref=f16e162]:
        - textbox "Your email address" [ref=f16e163]
        - button "" [ref=f16e164] [cursor=pointer]
        - paragraph [ref=f16e166]: Get the most recent updates from our site and be updated your self...
    - paragraph [ref=f16e170]: Copyright © 2021 All rights reserved
  - text: 
```

# Test source

```ts
  1  | import { test, expect } from '@fixtures/test';
  2  | import { Products, SearchTerm } from '@utils/testData';
  3  | import { adMasks, readyForCapture } from '@utils/visual';
  4  | 
  5  | test.describe('Visual: catalogue', { tag: ['@visual', '@products'] }, () => {
  6  |   test('VR-06 the products page header and search', async ({ products, page }) => {
  7  |     await products.open();
  8  |     await readyForCapture(page);
  9  | 
  10 |     // The application gives the search control no wrapper of its own, so the input and
  11 |     // its button are captured as the two components they are.
  12 |     await expect(page.locator('#search_product')).toHaveScreenshot('search-input.png');
  13 |     await expect(page.locator('#submit_search')).toHaveScreenshot('search-button.png');
  14 |   });
  15 | 
  16 |   test('VR-07 search results heading and first tile', async ({ products, page }) => {
  17 |     await products.open();
  18 |     await products.search(SearchTerm.broad);
  19 |     await readyForCapture(page);
  20 | 
  21 |     await expect(products.sectionTitle).toHaveScreenshot('searched-title.png');
  22 |     await expect(products.items.first()).toHaveScreenshot('search-result-tile.png', {
  23 |       mask: adMasks(page),
  24 |     });
  25 |   });
  26 | 
  27 |   test('VR-08 the product information panel', async ({ details, page }) => {
  28 |     await details.open(Products.blueTop.id);
  29 |     await readyForCapture(page);
  30 | 
  31 |     await expect(details.information).toHaveScreenshot('product-information.png', {
  32 |       mask: adMasks(page),
  33 |     });
  34 |   });
  35 | 
  36 |   test('VR-09 the review form', async ({ details, page }) => {
  37 |     await details.open(Products.blueTop.id);
  38 |     await readyForCapture(page);
  39 | 
  40 |     await expect(page.locator('#review-form')).toHaveScreenshot('review-form.png', {
  41 |       mask: adMasks(page),
  42 |     });
  43 |   });
  44 | 
  45 |   test('VR-10 a category listing', async ({ products, page }) => {
  46 |     await products.open();
  47 |     await products.openCategory('Women', 'Dress');
  48 |     await readyForCapture(page);
  49 | 
> 50 |     await expect(products.sectionTitle).toHaveScreenshot('category-title.png');
     |                                         ^ Error: expect(locator).toHaveScreenshot(expected) failed
  51 |     await expect(products.items.first()).toHaveScreenshot('category-tile.png', {
  52 |       mask: adMasks(page),
  53 |     });
  54 |   });
  55 | });
  56 | 
```