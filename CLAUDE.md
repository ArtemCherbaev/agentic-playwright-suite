# Working in this repository

End to end, visual regression and REST API tests for
[Automation Exercise](https://automationexercise.com), in Playwright and TypeScript. The tests are
authored and repaired through Claude Code agents working over Playwright MCP. **The pipeline itself
runs no model.** A suite that needs a model at runtime is a suite whose result cannot be reproduced,
and reproducibility is the only reason to trust it.

## Commands

```bash
yarn install                      # Yarn 4 through Corepack; run `corepack enable` once
yarn playwright:install:chromium  # Chromium only; CI adds WebKit
yarn test:e2e                     # the functional suite, 20 cases
yarn test:e2e:webkit              # the same cases on the engine behind Safari
yarn test:api                     # the REST API suite, 12 cases, no browser
yarn docker:vr                    # the visual suite, in the image CI uses
yarn check                        # typecheck, lint, format check
yarn metrics                      # regenerate the suite health page
yarn feed                         # build the run feed from the JSON reports
```

One case while developing it: `npx playwright test --grep "TC-12"`.

## Layout

```
tests/        20 functional cases, one directory per feature area
vr-tests/     20 visual cases and their committed Linux baselines
api-tests/    12 API cases over HTTP, with the fixture that owns their accounts
utils/        Page objects, fixtures, test data, the capture helper, scripts
specs/        The test plan and the status report
docs/         Architecture, pipeline, agents, decisions
env/docker/   The execution image
.claude/      Seven agents, three skills, four commands
```

## The rules that matter

Read the skills before working here. They are not summaries of this file; they carry the detail.

- **`playwright-conventions`** — locator policy, page object boundaries, naming, test data.
- **`flake-policy`** — what to do when a case fails intermittently, and the four things you may
  never do about it.
- **`visual-regression`** — capturing against an advertising supported target, and reading a diff.

The four that come up most often:

1. **Retries are zero, and stay zero.** A retry turns a flaky test into a green tick and throws away
   the only run that had anything to say.
2. **Page objects act, tests assert.** A helper that asserts on its own leaves cases that appear to
   check nothing.
3. **Join on identifiers the application owns.** The advertiser writes inside product titles on this
   target. Cart assertions use `data-product-id`, never a scraped name.
4. **Twenty cases per suite, capped.** New coverage replaces existing coverage. If you cannot say
   which case yours replaces, it should not be written.

## The target is someone else's server

A shared public demo with a real database and third party advertising on every page. That is the
point of it: the failures it produces are the failures a real pipeline produces. It also means:

- Every account the suite creates is unique and is deleted by the fixture that made it.
- Worker counts are capped. Three test jobs hit one host in parallel on `main`.
- When the whole suite fails at the same step, look at the other engine in that run before editing
  anything. If WebKit passed the same twenty cases, the host was overloaded, not the suite.

## Before handing work back

```bash
yarn check
npx playwright test --grep "TC-nn" --repeat-each 5 --workers 1
```

A case that has been run once has not been shown to be stable, and an unstable case is a liability
the suite adopts forever. Report the numbers you actually ran, including the failures.

## Where the reasoning lives

`docs/decisions.md` holds the calls a reviewer would question and what broke while building this,
including the ones that were embarrassing. `specs/STATUS.md` holds coverage per area and the defects
raised against the application, including the case parked because the application is at fault.
