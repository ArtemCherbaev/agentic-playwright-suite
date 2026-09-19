---
name: playwright-conventions
description: The house style for this Playwright suite - locator policy, page object boundaries, naming, test data, and what a comment is for. Load before writing or reviewing any test, page object or fixture in this repository.
---

# Playwright conventions

The rules below are not preferences. Each one is here because breaking it cost this suite a run.

## Locators, in order of preference

1. `getByRole` with an accessible name.
2. `getByTestId`, which is `data-qa` on this application (set as `testIdAttribute` in the config).
3. An id the application clearly owns.
4. A CSS class, and only with a comment saying why the three above did not work.

Never XPath, never `nth-child`. Both describe where an element sits in the document rather than what
it is, and both break on a change a person reading the page would not even notice.

**`exact: true` is a trap on anything with an icon.** Generated content from an icon font joins the
accessible name once the stylesheet applies. `getByRole('link', { name: 'Women', exact: true })`
resolved on one run of a commit and returned zero on the next, because the stylesheet had loaded.

**Scope any text match the page uses twice.** The contact form's success banner and the footer
subscription box share their wording; unscoped, the match resolves to two elements.

## Page objects act, tests assert

A page object method performs an interaction and returns. The case that called it decides what
success looks like and asserts it. Helpers that assert on their own leave cases that appear to check
nothing, and the `playwright/expect-expect` rule will say so.

The exception is a method whose whole purpose is to reach a state — `AuthPage.register` asserts that
registration succeeded, because every caller needs that to be true before their own subject begins.

## Join on identifiers, not on text

This target carries advertiser injected markup inside product titles. Two shapes have been seen on
one page within a minute: text appended inside the title, and the whole title wrapped in the
advertiser's own element. A name scraped from a tile is therefore not reliably the product's name,
and an empty one passed to a `hasText` filter matches every row in the cart.

Cart assertions join on `data-product-id` from the tile and `id="product-<id>"` on the row. Where a
displayed name genuinely is the subject, read it through `utils/text.ts`, which handles both shapes.

## Test data

The target is a shared public database and this suite runs on every push. Every account is unique per
call (`newUser()`), and the fixture that created it deletes it in teardown, including after a failure.
Nothing fixed, nothing left behind.

## Naming

`TC-nn` plus a sentence about the application:

> TC-16 removing the only product leaves the cart empty, not stale

not

> TC-16 remove test

The second half of that name is the assertion that would otherwise be missed.

## Comments

Explain why, never what. `// click the button` is noise. `// the modal steals the next click if it
is not dismissed first` is the reason the next line exists. Where a decision looks wrong to a
reviewer, the comment is where it gets defended.
