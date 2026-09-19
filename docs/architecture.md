# Architecture

## Shape

```
playwright.config.ts   three projects: chromium, webkit, visual
tests/                 20 functional cases, one directory per feature area
vr-tests/              20 visual cases and their Linux baselines
utils/
  pageObjects/         one class per page, all extending BasePage
  fixtures/test.ts     the extended `test`, page objects and the account fixture
  testData.ts          unique-per-call user and message factories, product constants
  text.ts              reading a product name the advertiser has written into
  visual.ts            the capture helper
  scripts/             the suite health page generator
specs/                 the test plan and the status report
env/docker/            the execution image
```

## Three projects, three questions

| Project    | Answers                                            | Workers in CI |
| ---------- | -------------------------------------------------- | ------------- |
| `chromium` | Does the application work? This one gates a merge. | 1             |
| `webkit`   | Does it work on the engine behind Safari?          | 2             |
| `visual`   | Does it still look the way it looked?              | 1             |

The worker budget is a precaution rather than a measured limit. Three test jobs hit one shared demo
host in parallel on `main`; the cap costs nothing and removes the suite as a suspect when something
times out.

WebKit doubles as a control. When the whole functional suite fails at one step, WebKit passing the
same twenty cases says the host was overloaded, not that the suite is wrong.

## Page objects

One class per page, all extending `BasePage`, which owns what every page shares: the header, the
footer subscription box, the consent dialog, the advertiser's vignette, and the animation freeze.

**Page objects act; tests assert.** A method performs an interaction and returns; the case that
called it decides what success looks like. The exception is a method whose purpose is to reach a
state — `AuthPage.register` asserts that registration succeeded, because every caller needs that
before their own subject begins.

`CartPage` is the one to read first. It owns the modal that opens on every add to cart, which is the
most load bearing object in the suite: a case that forgets to dismiss it loses its next click to the
backdrop and fails somewhere else entirely.

## Locator policy

1. `getByRole` with an accessible name.
2. `getByTestId`, which is `data-qa` here (`testIdAttribute` in the config).
3. An id the application clearly owns.
4. A CSS class, with a comment saying why the first three did not work.

No XPath, no `nth-child`. Both encode the shape of the document rather than the thing a person is
looking for.

Two traps this suite has actually fallen into, both written up in `docs/decisions.md`:

- `exact: true` on a name containing an icon, where generated content joins the accessible name once
  the stylesheet applies.
- Joining on displayed text that a third party writes into.

## Fixtures

`utils/fixtures/test.ts` extends Playwright's `test` with a page object per page and an `account`
fixture that registers a unique user, hands it to the case, and deletes it afterwards — including
after a failure, because the target is a shared database and an account left behind stays there.

## Visual regression

Baselines are Chromium on Linux, generated inside the image CI runs, path stamped with the platform.
`.gitignore` refuses `-win32` and `-darwin` baselines.

`utils/visual.ts` prepares every page identically before a capture: wait for `load`, collapse the
advertiser's containers, neutralise the annotations that wrap the application's own text, wait for
the images, force every declared font face and wait two frames for the re-layout, then wait for the
page height to stop changing. Each of those steps is there because of a specific failure; the table
in the `visual-regression` skill says which.

Captures are components, not pages. A full page screenshot fails on any change anywhere in it.

## Reporting

| Output               | For                                                           |
| -------------------- | ------------------------------------------------------------- |
| `playwright-report/` | The HTML report and the traces, replayable step by step       |
| `allure-results/`    | Fed to Allure for the published dashboards and their trend    |
| `reports/junit/`     | The machine readable result                                   |
| `reports/json/`      | Read by `utils/scripts/suite-health.mjs`                      |
| `test-results/`      | Failure artefacts, including expected, actual and diff images |

The suite health page is deliberately separate from Allure. Allure answers "did this run pass". The
health page answers "is this suite worth believing", which decides whether coverage gets added this
week, and prints every number against a stated threshold.
