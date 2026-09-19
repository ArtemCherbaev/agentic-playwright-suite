import type { Locator, Page } from '@playwright/test';

/**
 * What every screenshot in the visual suite has to agree on.
 *
 * The target serves third party advertising, a rotating carousel, and images it
 * loads late. All three move between one run and the next without anything in
 * the application having changed, and all three are inside the area a full page
 * screenshot covers. Left alone they produce a suite that fails most mornings
 * and is ignored by lunchtime.
 *
 * They are handled in three different ways on purpose:
 *
 *   advertising   masked, not blocked. Blocking it would remove the space it
 *                 occupies and change the layout the baseline is of, which
 *                 means the suite would stop watching the real page.
 *   animation     stopped at the first frame by Playwright's own
 *                 `animations: 'disabled'`, set in the config.
 *   late images   waited for, rather than masked, because an image that fails
 *                 to load is a defect this suite should catch.
 */

/** Everything an advertiser controls, masked out of the comparison. */
export function adMasks(page: Page): Locator[] {
  return [
    page.locator('iframe[id^="google_ads"]'),
    page.locator('iframe[name^="aswift"]'),
    page.locator('ins.adsbygoogle'),
    page.locator('.google-anno'),
    page.locator('#aswift_0_host, #aswift_1_host, #aswift_2_host'),
  ];
}

/**
 * Wait until every image in scope has either decoded or failed.
 *
 * Playwright's `networkidle` is not enough here: the advertising keeps
 * connections open, so the page is never idle and the wait times out having
 * proved nothing. Asking the images themselves is both faster and true.
 */
export async function imagesSettled(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      Array.from(document.images)
        .filter((img) => img.src && !img.src.startsWith('data:'))
        .every((img) => img.complete),
    undefined,
    { timeout: 20_000 },
  );
}

/** Prepare a page for capture: freeze what moves, wait for what loads. */
export async function readyForCapture(page: Page): Promise<void> {
  // Wait for the document's own resources before asking anything about fonts.
  // Pages are opened on `domcontentloaded`, so the stylesheet that declares the
  // web fonts can still be in flight: `document.fonts` then enumerates a
  // shorter list than the page will eventually use, every face in it loads, and
  // the real typeface arrives after the capture. This wait is bounded because
  // the advertising can keep a page from ever reaching `load`, and a capture in
  // the wrong font is better than no capture at all.
  await page.waitForLoadState('load', { timeout: 15_000 }).catch(() => undefined);

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-play-state: paused !important;
        animation-delay: 0s !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      /* The carousel is parked on its first slide, so a capture taken four
         seconds into a run and one taken twelve seconds in agree. */
      #slider-carousel .carousel-inner .item { transition: none !important; }
      #scrollUp { display: none !important; }

      /* Collapse the advertiser's containers to nothing.
         Masking alone was not enough. A mask changes what is compared, not what
         is on the page, and these containers resize themselves for as long as
         the tab is open: Google injects one as the first child of #footer, so
         the footer's bounding box never held still for two consecutive frames
         and every capture of it timed out waiting for the element to be stable.
         Collapsing them is applied on every run, before both the baseline and
         the comparison, so the two see the same page. What that page shows is
         the application's own layout, which is the thing this suite is for. */
      .google-auto-placed,
      .google-anno-skip,
      .google-anno-sc,
      ins.adsbygoogle,
      iframe[id^="google_ads"],
      iframe[name^="aswift"],
      [id^="aswift_"] {
        display: none !important;
      }

      /* The annotations come in two shapes and they cannot be treated alike.
         The rule above removes the ones that are the advertiser's own widget,
         including the one injected inside the empty cart's paragraph, which
         shifted that centred sentence by a different amount on every run.
         The rule below is for the other shape, where the advertiser has
         wrapped the application's own text: hiding that would take the
         product's name out of the baseline, so the wrapper stays and only its
         decoration goes. */
      .google-anno,
      .google-anno-t {
        text-decoration: none !important;
        color: inherit !important;
        cursor: inherit !important;
      }
      .google-anno svg,
      .google-anno img {
        display: none !important;
      }
    `,
  });
  await imagesSettled(page);

  // Wait for the fonts before anything with text in it is captured.
  // Two runs of this suite against the same machine and the same commit
  // disagreed by three to six percent of the pixels on captures that were
  // nothing but text. The cause was the web fonts arriving after the capture on
  // one run and before it on the other, so the same heading was photographed in
  // two different typefaces. `document.fonts.ready` is the browser's own answer
  // to "have they arrived", and is a great deal more reliable than a sleep.
  await page.evaluate(async () => {
    await document.fonts.ready;
    // `fonts.ready` only settles the faces the browser has already asked for,
    // and a face is only asked for when something on the page first needs it.
    // Loading every declared face and waiting again closes that gap; without
    // it, two runs a minute apart photographed the same heading in two
    // different typefaces and differed by a fifth of their pixels.
    const faces: FontFace[] = [];
    document.fonts.forEach((face) => faces.push(face));
    await Promise.all(faces.map((face) => face.load().catch(() => undefined)));
    await document.fonts.ready;

    // Loaded is not the same as painted. A face that arrives after first paint
    // re-lays out the text that uses it, and a capture taken in the same tick
    // photographs the fallback. Two frames is the compositor's own answer to
    // "has the new text been drawn yet"; the baselines that disagreed with
    // every later run were all captures of a heading in the fallback face.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });

  // The collapse above reflows the page once. Wait for the document to stop
  // changing height before capturing, rather than for a duration someone
  // guessed: two identical samples mean the reflow has finished.
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __lastHeight?: number };
      const height = document.body.scrollHeight;
      const settled = w.__lastHeight === height;
      w.__lastHeight = height;
      return settled;
    },
    undefined,
    { timeout: 10_000, polling: 250 },
  );
}
